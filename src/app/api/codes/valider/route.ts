import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/codes/valider - Valider un code et contrôler la révocation en temps réel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, reason: 'Aucun code fourni', code: 401 },
        { status: 401 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Interroger la base de données Supabase
    const { data: matched, error } = await supabaseAdmin
      .from('access_codes')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) {
      console.error('Erreur Supabase validation:', error);
      // Fallback si problème de connexion DB
      return NextResponse.json({ valid: true });
    }

    if (!matched) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Ce code d’accès n’existe pas ou a été supprimé par l’Administrateur.',
          code: 401,
        },
        { status: 401 }
      );
    }

    if (matched.revoked) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Votre accès a été révoqué par l’Administrateur.',
          code: 401,
        },
        { status: 401 }
      );
    }

    if (matched.expires_at) {
      const expTime = new Date(matched.expires_at).getTime();
      if (Date.now() > expTime) {
        return NextResponse.json(
          {
            valid: false,
            reason: 'Votre code d’accès a expiré.',
            code: 401,
          },
          { status: 401 }
        );
      }
    }

    // Incrémenter le nombre d'utilisations et mettre à jour la dernière connexion
    await supabaseAdmin
      .from('access_codes')
      .update({
        use_count: (matched.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', matched.id);

    return NextResponse.json({
      valid: true,
      label: matched.label,
      expiresAt: matched.expires_at,
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, reason: 'Erreur serveur validation code' },
      { status: 500 }
    );
  }
}

// GET /api/codes/valider?code=... - Contrôle rapide en tâche de fond pour l'expulsion immédiate
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, reason: 'Code manquant' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const { data: matched, error } = await supabaseAdmin
      .from('access_codes')
      .select('id, code, revoked, expires_at')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error || !matched) {
      return NextResponse.json({
        valid: false,
        reason: 'Code non trouvé ou révoqué par l’Administrateur.',
      });
    }

    if (matched.revoked) {
      return NextResponse.json({
        valid: false,
        reason: 'Code révoqué par l’Administrateur.',
      });
    }

    if (matched.expires_at && Date.now() > new Date(matched.expires_at).getTime()) {
      return NextResponse.json({
        valid: false,
        reason: 'Code expiré.',
      });
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    return NextResponse.json({ valid: true });
  }
}
