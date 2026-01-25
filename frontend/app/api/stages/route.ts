import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data for stages
  const stages = [
    { id: 1, name: 'Draft', sequenceOrder: 1 },
    { id: 2, name: 'In Review', sequenceOrder: 2 },
    { id: 3, name: 'Pending Approval', sequenceOrder: 3 },
    { id: 4, name: 'Approved', sequenceOrder: 4 },
    { id: 5, name: 'Released', sequenceOrder: 5 },
    { id: 6, name: 'Obsolete', sequenceOrder: 6 },
  ];

  return NextResponse.json({
    success: true,
    data: {
      stages,
    },
  });
}
