// app/api/pigeons/import/route.js
// Excel'deki mevcut verileri toplu içe aktar

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  // Excel'deki kuş listesi
  const pigeons = [
    { ringId: 'TR-24-T0-01', ringLabel: 'Siyah 081',                  gender: 'Dişi'  },
    { ringId: 'TR-24-T0-02', ringLabel: 'Kırmızı Çıt Hayrabolu',      gender: 'Erkek' },
    { ringId: 'TR-24-T0-03', ringLabel: 'Bileziksiz - Murat BATU',    gender: 'Dişi'  },
    { ringId: 'TR-24-T0-04', ringLabel: 'Hayrabolu TR 47',             gender: 'Erkek' },
    { ringId: 'TR-24-T0-05', ringLabel: 'Bahadır-0652',               gender: 'Dişi'  },
    { ringId: 'TR-24-T0-06', ringLabel: 'Kırmızı Bahadır',            gender: 'Erkek' },
    { ringId: 'TR-25-T1-01', ringLabel: 'Mavi - 4'  },
    { ringId: 'TR-25-T1-02', ringLabel: 'Mavi - 5'  },
    { ringId: 'TR-26-T1-03', ringLabel: 'Mavi - 6'  },
    { ringId: 'TR-26-T1-04', ringLabel: 'Mavi - 7'  },
    { ringId: 'TR-26-T1-05', ringLabel: 'Mavi - 8'  },
    { ringId: 'TR-26-T1-06', ringLabel: 'Mavi - 9'  },
    { ringId: 'TR-26-T2-01', ringLabel: 'Siyah - 9'  },
    { ringId: 'TR-26-T2-02', ringLabel: 'Siyah - 10' },
    { ringId: 'TR-26-T2-03', ringLabel: 'Siyah - 11' },
    { ringId: 'TR-26-T2-04', ringLabel: 'Siyah - 12' },
    { ringId: 'TR-26-T2-05', ringLabel: 'Çift Siyah Boncuk' },
    { ringId: 'TR-26-T2-06', ringLabel: 'Siyah - 14' },
    { ringId: 'TR-26-T3-01', ringLabel: 'Kırmızı - 1' },
    { ringId: 'TR-26-T3-02', ringLabel: 'Kırmızı - 2' },
    { ringId: 'TR-26-T1-07', ringLabel: 'Mavi - 10' },
    { ringId: 'TR-26-T1-08', ringLabel: 'Mavi - 12' },
    { ringId: 'TR-26-T2-07', ringLabel: 'Siyah - 15' },
    { ringId: 'TR-26-T2-08', ringLabel: 'Siyah - 16' },
    { ringId: 'TR-26-T1-09', ringLabel: 'Mavi - 13' },
    { ringId: 'TR-26-T1-10', ringLabel: 'Mavi - 14' },
    { ringId: 'TR-26-T3-03', ringLabel: 'Kırmızı - 3' },
    { ringId: 'TR-26-T3-04', ringLabel: 'Kırmızı - 4' },
    { ringId: 'TR-26-T2-09', ringLabel: 'Siyah - 17' },
    { ringId: 'TR-26-T2-10', ringLabel: 'Siyah - 18' },
  ];

  // Takımlar
  const teams = [
    { teamNo: 1, season: '2025-2026', motherLabel: 'Siyah 081',               fatherLabel: 'Kırmızı Çıt Hayrabolu', ringColor: 'Mor - Mor'     },
    { teamNo: 2, season: '2025-2026', motherLabel: 'Bahadır-0652',            fatherLabel: 'Kırmızı Bahadır',       ringColor: 'Yeşil - Yeşil' },
    { teamNo: 3, season: '2025-2026', motherLabel: 'Bileziksiz - Murat BATU', fatherLabel: 'Hayrabolu TR 47',       ringColor: 'Beyaz - Beyaz' },
  ];

  // Kuluçka verileri
  const clutchData = [
    { teamNo: 1, round: 1, eggDate: '2025-12-09', hatchDate: '2025-12-27', chicks: ['TR-25-T1-01', 'TR-25-T1-02'] },
    { teamNo: 1, round: 2, eggDate: '2026-01-10', hatchDate: '2026-01-27', chicks: ['TR-26-T1-03', 'TR-26-T1-04'] },
    { teamNo: 1, round: 3, eggDate: '2026-02-11', hatchDate: '2026-03-01', chicks: ['TR-26-T1-05', 'TR-26-T1-06'] },
    { teamNo: 1, round: 4, eggDate: '2026-03-14', hatchDate: '2026-04-01', chicks: ['TR-26-T1-07', 'TR-26-T1-08'] },
    { teamNo: 1, round: 5, eggDate: '2026-04-18', hatchDate: '2026-05-03', chicks: ['TR-26-T1-09', 'TR-26-T1-10'] },
    { teamNo: 2, round: 1, eggDate: '2025-12-26', hatchDate: '2026-01-14', chicks: ['TR-26-T2-01', 'TR-26-T2-02'] },
    { teamNo: 2, round: 2, eggDate: '2026-01-30', hatchDate: '2026-02-14', chicks: ['TR-26-T2-03', 'TR-26-T2-04'] },
    { teamNo: 2, round: 3, eggDate: '2026-03-04', hatchDate: '2026-03-22', chicks: ['TR-26-T2-05', 'TR-26-T2-06'] },
    { teamNo: 2, round: 4, eggDate: '2026-04-04', hatchDate: '2026-04-23', chicks: ['TR-26-T2-07', 'TR-26-T2-08'] },
    { teamNo: 2, round: 5, eggDate: '2026-05-06', hatchDate: '2026-05-24', chicks: ['TR-26-T2-09', 'TR-26-T2-10'] },
    { teamNo: 3, round: 1, eggDate: '2026-03-05', hatchDate: '2026-03-23', chicks: ['TR-26-T3-01', 'TR-26-T3-02'] },
    { teamNo: 3, round: 2, eggDate: '2026-05-18', hatchDate: '2026-06-05', chicks: ['TR-26-T3-03', 'TR-26-T3-04'] },
  ];

  let created = { pigeons: 0, teams: 0, clutches: 0 };

  // Kuşları ekle
  for (const p of pigeons) {
    await db.pigeon.upsert({
      where: { userId_ringId: { userId, ringId: p.ringId } },
      create: { userId, ...p },
      update: { ringLabel: p.ringLabel, gender: p.gender || null },
    });
    created.pigeons++;
  }

  // Takımları ekle
  for (const t of teams) {
    await db.pigeonTeam.upsert({
      where: { userId_teamNo: { userId, teamNo: t.teamNo } },
      create: { userId, ...t },
      update: t,
    });
    created.teams++;
  }

  // Kuluçkaları ekle
  for (const c of clutchData) {
    const team = await db.pigeonTeam.findUnique({ where: { userId_teamNo: { userId, teamNo: c.teamNo } } });
    if (!team) continue;

    // Aynı takım+tur varsa atlat
    const existing = await db.clutch.findFirst({ where: { teamId: team.id, round: c.round } });
    if (existing) continue;

    // Yavru kuşları bul
    const chickPigeons = await db.pigeon.findMany({
      where: { userId, ringId: { in: c.chicks } },
    });

    await db.clutch.create({
      data: {
        userId,
        teamId:    team.id,
        round:     c.round,
        eggDate:   new Date(c.eggDate),
        hatchDate: new Date(c.hatchDate),
        eggs: {
          create: chickPigeons.map(p => ({ pigeonId: p.id })),
        },
      },
    });
    created.clutches++;
  }

  return NextResponse.json({ success: true, created });
}
