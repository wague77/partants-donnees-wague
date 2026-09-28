import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/codes - Lister tous les codes (Espace Admin)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase GET /api/codes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ codes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/codes - Créer un nouveau code d'accès
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, durationDays, maxUses, customCode, level } = body;

    let cleanCode = customCode ? customCode.trim().toUpperCase().replace(/\s+/g, '-') : '';
    if (!cleanCode) {
      const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      cleanCode = `WAGUE-${rand1}-${rand2}`;
    }

    let expiresAt: string | null = null;
    if (durationDays && durationDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + Number(durationDays));
      expiresAt = d.toISOString();
    }

    const newRow = {
      code: cleanCode,
      label: label?.trim() || 'Code Accès Utilisateur',
      expires_at: expiresAt,
      revoked: false,
      use_count: 0,
      created_by: 'admin',
      niveau: level || 'premium',
      expiry_logged: false,
    };

    const { data, error } = await supabaseAdmin
      .from('access_codes')
      .insert([newRow])
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase POST /api/codes:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, code: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur création code' }, { status: 500 });
  }
}

// PATCH /api/codes - Mettre à jour (Suspendre / Réactiver / Prolongation)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, code, revoked, expires_at, label } = body;

    if (!id && !code) {
      return NextResponse.json({ error: 'ID ou Code requis' }, { status: 400 });
    }

    const updates: any = {};
    if (revoked !== undefined) updates.revoked = revoked;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (label !== undefined) updates.label = label;

    let query = supabaseAdmin.from('access_codes').update(updates);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('code', code.toUpperCase());
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur mise à jour' }, { status: 500 });
  }
}

// DELETE /api/codes - Révocation / Suppression définitive du code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');

    if (!id && !code) {
      return NextResponse.json({ error: 'ID ou Code requis' }, { status: 400 });
    }

    // Nous passons revoked = true pour marquer la révocation stricte en DB
    let query = supabaseAdmin
      .from('access_codes')
      .update({ revoked: true });

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('code', code!.toUpperCase());
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Code révoqué et supprimé avec succès' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur suppression code' }, { status: 500 });
  }
}
