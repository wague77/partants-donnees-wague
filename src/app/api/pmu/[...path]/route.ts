import { NextRequest, NextResponse } from 'next/server';

const PMU_BASE_URL = 'https://offline.turfinfo.api.pmu.fr/rest/client/7/programme';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const subpath = params.path ? params.path.join('/') : '';
    const targetUrl = `${PMU_BASE_URL}/${subpath}`;

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 30 }, // cache 30s
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erreur PMU API (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur API Proxy PMU:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données PMU' },
      { status: 500 }
    );
  }
}
