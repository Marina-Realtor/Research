import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  console.log('Sending test email...');

  try {
    const result = await sendTestEmail();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: 500 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Test email failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
