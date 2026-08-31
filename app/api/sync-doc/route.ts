import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

const DOC_ID = '1MQWShnBS1wbHtjwCzi0Ybs5wRYHfDYUZE0V0jUi4Mvc';
const DOC_EXPORT_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=txt`;

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the Google Doc as plain text
    const response = await fetch(DOC_EXPORT_URL, { next: { revalidate: 0 } });
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Google Doc. Make sure it is set to "Anyone with link can view".' },
        { status: 500 }
      );
    }
    const text = await response.text();

    // Parse and update days
    const updates = parseDocUpdates(text);

    const supabase = createServiceClient();
    let daysUpdated = 0;
    const changes: string[] = [];

    for (const update of updates) {
      // Split out time fields so they never break the main update if the
      // DB columns haven't been created yet (run the SQL migration first).
      const { departure_time, arrival_time, ...mainFields } = update.fields;

      // ── Main fields update (always-present columns) ──────────────────────
      if (Object.keys(mainFields).length > 0) {
        const { error } = await supabase
          .from('days')
          .update(mainFields)
          .eq('id', update.dayId);

        if (!error) {
          daysUpdated++;
          changes.push(`Day ${update.dayId}: updated ${Object.keys(mainFields).join(', ')}`);
        } else {
          console.error(`Error updating day ${update.dayId}:`, error);
        }
      }

      // ── Time fields update (requires SQL migration) ──────────────────────
      const timeFields: Record<string, string> = {};
      if (departure_time) timeFields.departure_time = departure_time;
      if (arrival_time)   timeFields.arrival_time   = arrival_time;

      if (Object.keys(timeFields).length > 0) {
        const { error: timeErr } = await supabase
          .from('days')
          .update(timeFields)
          .eq('id', update.dayId);

        if (!timeErr) {
          changes.push(`Day ${update.dayId}: updated departure_time, arrival_time`);
        } else {
          // Columns probably don't exist yet — run the SQL migration in Supabase:
          // ALTER TABLE days ADD COLUMN IF NOT EXISTS departure_time TEXT;
          // ALTER TABLE days ADD COLUMN IF NOT EXISTS arrival_time TEXT;
          console.warn(`Day ${update.dayId} time fields skipped (run SQL migration):`, timeErr.message);
        }
      }
    }

    // Parse and sync post-ride content (diary_entries for day IDs 9, 10, 11)
    const postHikeUpdates = parsePostHike(text);
    let postHikeDaysUpdated = 0;

    for (const { dayId, content } of postHikeUpdates) {
      const { error } = await supabase
        .from('diary_entries')
        .upsert({ day_id: dayId, content, updated_at: new Date().toISOString() }, { onConflict: 'day_id' });

      if (!error) {
        postHikeDaysUpdated++;
        changes.push(`Post-hike day ${dayId}: updated content`);
      } else {
        console.error(`Error updating post-hike day ${dayId}:`, error);
      }
    }

    return NextResponse.json({ success: true, daysUpdated, postHikeDaysUpdated, changes });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

interface DayFields {
  route_url?: string;
  accommodation_name?: string;
  accommodation_booking_ref?: string;
  accommodation_notes?: string;
  accommodation_url?: string;
  dinner_options?: Array<{ name: string; notes: string }>;
  resupply_notes?: string;
  departure_time?: string;
  arrival_time?: string;
}

function parseDocUpdates(text: string): Array<{ dayId: number; fields: DayFields }> {
  const results: Array<{ dayId: number; fields: DayFields }> = [];

  // Split into day sections by detecting "Day N:" patterns
  // The plain-text export may have lines like "Day 1: Saturday May 2" or "Day 1:"
  const daySectionRegex = /(?=^Day\s+(\d+)\s*:)/im;
  const parts = text.split(daySectionRegex);

  // The split produces alternating: [pre-content, dayNum, section, dayNum, section, ...]
  // Walk through and pair up day numbers with their sections
  let i = 0;
  // Skip any content before the first day
  while (i < parts.length && !/^\d+$/.test(parts[i].trim())) {
    i++;
  }

  while (i < parts.length) {
    const dayNumStr = parts[i].trim();
    const dayNum = parseInt(dayNumStr, 10);
    i++;
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 7) {
      i++; // skip the section content too
      continue;
    }
    const sectionText = parts[i] || '';
    i++;

    const fields = parseDaySection(sectionText, dayNum);
    if (Object.keys(fields).length > 0) {
      results.push({ dayId: dayNum, fields });
    }
  }

  return results;
}

function parseDaySection(text: string, dayNum: number): DayFields {
  const fields: DayFields = {};
  const lines = text.split('\n');

  // ── Strava route URL ──────────────────────────────────────────────────────
  // Look for a URL containing strava.com/routes anywhere in the section
  for (const line of lines) {
    // Markdown link: [text](url)
    const mdMatch = line.match(/\[.*?\]\((https?:\/\/[^)]*strava\.com\/routes[^)]*)\)/i);
    if (mdMatch) {
      fields.route_url = mdMatch[1];
      break;
    }
    // Plain URL
    const plainMatch = line.match(/(https?:\/\/[^\s]*strava\.com\/routes[^\s]*)/i);
    if (plainMatch) {
      fields.route_url = plainMatch[1];
      break;
    }
  }

  // ── Sleep / Accommodation section ─────────────────────────────────────────
  const sleepStartIdx = lines.findIndex((l) =>
    /sleep\s*:/i.test(l)
  );

  if (sleepStartIdx !== -1) {
    // Find the end of the sleep section: next top-level heading or "---" divider
    let sleepEndIdx = lines.length;
    for (let j = sleepStartIdx + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      // A new section heading: line that starts with ### or ## or is a divider
      if (/^(###|##|---)\s*/.test(l) && j > sleepStartIdx + 1) {
        sleepEndIdx = j;
        break;
      }
      // A new top-level subsection like "Dinner:" or "Hike:" or "Resupply:"
      if (/^(dinner|ride|resupply)\s*:/i.test(l) && j > sleepStartIdx + 1) {
        sleepEndIdx = j;
        break;
      }
    }

    const sleepLines = lines.slice(sleepStartIdx + 1, sleepEndIdx);

    // Accommodation name: first non-empty line that isn't a booking ref / price / note
    for (const line of sleepLines) {
      const trimmed = line.replace(/^[\s*#>-]+/, '').trim();
      if (!trimmed) continue;
      // Skip lines that look like booking details / prices
      if (/confirmation|booking\s*(ref|reference)|booking\s*#|ref\s*#|\£|\$|check.in|check.out|cancellation|paid|due|bunkhouse|hostel|hotel/i.test(trimmed)) {
        // The accommodation name might still be on this line if it's the first — extract it
        const nameMatch = trimmed.match(/^([A-Z][A-Za-z\s'&]+?(?:Hotel|Inn|Hostel|Bunkhouse|Lodge|Arms|House|B&B|Grill|Bar)[A-Za-z\s]*)/);
        if (nameMatch && !fields.accommodation_name) {
          fields.accommodation_name = nameMatch[1].trim();
        }
        continue;
      }
      if (!fields.accommodation_name) {
        fields.accommodation_name = trimmed;
        break;
      }
    }

    // Booking reference: lines with "Confirmation #", "Booking reference", "Ref"
    for (const line of sleepLines) {
      const refMatch = line.match(/(?:confirmation\s*#?|booking\s*ref(?:erence)?|ref\s*#?)\s*[:\-]?\s*([A-Z0-9]{5,})/i);
      if (refMatch) {
        fields.accommodation_booking_ref = refMatch[1];
        break;
      }
    }

    // Accommodation URL
    for (const line of sleepLines) {
      const mdMatch = line.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
      if (mdMatch && !/strava\.com/i.test(mdMatch[1])) {
        fields.accommodation_url = mdMatch[1];
        break;
      }
    }

    // Accommodation notes: collect remaining bullets (skip the name line & booking ref line)
    const noteLines: string[] = [];
    for (const line of sleepLines) {
      const trimmed = line.replace(/^[\s*#>-]+/, '').trim();
      if (!trimmed) continue;
      if (trimmed === fields.accommodation_name) continue;
      if (fields.accommodation_booking_ref && trimmed.includes(fields.accommodation_booking_ref)) continue;
      noteLines.push(trimmed);
    }
    if (noteLines.length > 0) {
      fields.accommodation_notes = noteLines.join(' · ');
    }
  }

  // ── Dinner section ─────────────────────────────────────────────────────────
  const dinnerStartIdx = lines.findIndex((l) => /dinner\s*:/i.test(l));
  if (dinnerStartIdx !== -1) {
    let dinnerEndIdx = lines.length;
    for (let j = dinnerStartIdx + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (/^(###|##|---)\s*/.test(l) && j > dinnerStartIdx + 1) {
        dinnerEndIdx = j;
        break;
      }
      if (/^(sleep|ride|resupply)\s*:/i.test(l) && j > dinnerStartIdx + 1) {
        dinnerEndIdx = j;
        break;
      }
    }

    const dinnerLines = lines.slice(dinnerStartIdx + 1, dinnerEndIdx);
    const dinnerOptions: Array<{ name: string; notes: string }> = [];

    for (const line of dinnerLines) {
      const trimmed = line.replace(/^[\s*#>-]+/, '').trim();
      if (!trimmed) continue;
      // Sub-bullets (indented more) go as notes on the last option
      const isSubBullet = /^\s{4,}/.test(line) || /^\s*\*\s+\*\s+/.test(line);
      if (isSubBullet && dinnerOptions.length > 0) {
        const last = dinnerOptions[dinnerOptions.length - 1];
        last.notes = last.notes ? `${last.notes}; ${trimmed}` : trimmed;
      } else {
        dinnerOptions.push({ name: trimmed, notes: '' });
      }
    }

    if (dinnerOptions.length > 0) {
      fields.dinner_options = dinnerOptions;
    }
  }

  // ── Departure / Arrival times ─────────────────────────────────────────────
  // Matches lines like: "Start riding: 6:30am, arrival at the Airbnb by 4:30pm"
  for (const line of lines) {
    const deptMatch = line.match(/start\s+riding[:\s]+(\d{1,2}:\d{2}\s*(?:am|pm))/i);
    if (deptMatch && !fields.departure_time) {
      fields.departure_time = deptMatch[1].replace(/\s+/g, '').toLowerCase();
    }
    const arrMatch = line.match(/arrival\s+(?:at\s+[^,]*?)?by\s+(\d{1,2}:\d{2}\s*(?:am|pm))/i);
    if (arrMatch && !fields.arrival_time) {
      fields.arrival_time = arrMatch[1].replace(/\s+/g, '').toLowerCase();
    }
  }

  // ── Resupply section ────────────────────────────────────────────────────────
  const resupplyStartIdx = lines.findIndex((l) =>
    /resupply|stock\s*up/i.test(l)
  );
  if (resupplyStartIdx !== -1) {
    let resupplyEndIdx = lines.length;
    for (let j = resupplyStartIdx + 1; j < lines.length; j++) {
      const l = lines[j].trim();
      if (/^(###|##|---)\s*/.test(l) && j > resupplyStartIdx + 1) {
        resupplyEndIdx = j;
        break;
      }
      if (/^(sleep|ride|dinner)\s*:/i.test(l) && j > resupplyStartIdx + 1) {
        resupplyEndIdx = j;
        break;
      }
    }
    const resupplyLines = lines
      .slice(resupplyStartIdx, resupplyEndIdx)
      .map((l) => l.replace(/^[\s*#>-]+/, '').trim())
      .filter(Boolean);
    if (resupplyLines.length > 0) {
      fields.resupply_notes = resupplyLines.join(' ');
    }
  }

  return fields;
}

// Maps post-ride day headings to diary day IDs 9, 10, 11
const POST_HIKE_HEADING_MAP: Array<{ keywords: string[]; dayId: number }> = [
  { keywords: ['saturday', '12'], dayId: 9 },
  { keywords: ['sunday', '13'], dayId: 10 },
  { keywords: ['monday', '14'], dayId: 11 },
];

function lineMatchesHeading(line: string, keywords: string[]): boolean {
  // Normalize: lowercase, collapse all whitespace to single space, strip non-alphanumeric except spaces
  const normalized = line.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return keywords.every((kw) => normalized.includes(kw));
}

function parsePostHike(text: string): Array<{ dayId: number; content: string }> {
  // Normalize line endings to \n
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const results: Array<{ dayId: number; content: string }> = [];

  for (const { keywords, dayId } of POST_HIKE_HEADING_MAP) {
    const headingIdx = lines.findIndex((l) => lineMatchesHeading(l, keywords));
    if (headingIdx === -1) continue;

    // Collect content lines until the next post-hike heading or end of file
    const contentLines: string[] = [];
    for (let j = headingIdx + 1; j < lines.length; j++) {
      const isNextHeading = POST_HIKE_HEADING_MAP.some(({ keywords: kws }) =>
        lineMatchesHeading(lines[j], kws)
      );
      if (isNextHeading) break;
      contentLines.push(lines[j]);
    }

    const content = contentLines.join('\n').trim();
    if (content) {
      results.push({ dayId, content });
    }
  }

  return results;
}
