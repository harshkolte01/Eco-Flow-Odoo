import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data for users
  const users = [
    { id: 1, name: 'System Administrator', email: 'admin@ecoflow.com' },
    { id: 2, name: 'Engineering Manager', email: 'engineering@ecoflow.com' },
    { id: 3, name: 'Quality Assurance', email: 'qa@ecoflow.com' },
    { id: 4, name: 'Operations Lead', email: 'ops@ecoflow.com' },
  ];

  return NextResponse.json({
    success: true,
    data: {
      users,
    },
  });
}
