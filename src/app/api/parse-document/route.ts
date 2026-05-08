import { NextRequest, NextResponse } from 'next/server';
import * as mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file buffer
    const buffer = await file.arrayBuffer();
    
    let text = '';
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
       const parsed = await pdfParse(Buffer.from(buffer));
       text = parsed.text;
    } else {
       // Parse the document using mammoth
       const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
       text = result.value;
    }

    // Truncate to save tokens and prevent huge payloads
    const CHAR_LIMIT = 30000;
    if (text.length > CHAR_LIMIT) {
      text = text.slice(0, CHAR_LIMIT);
    }

    return NextResponse.json({ text, name: file.name });
  } catch (error: any) {
    console.error('Error parsing document:', error);
    return NextResponse.json({ error: 'Failed to parse document: ' + error.message }, { status: 500 });
  }
}
