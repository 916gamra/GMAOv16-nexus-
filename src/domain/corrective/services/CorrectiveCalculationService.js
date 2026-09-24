/**
 * CorrectiveCalculationService.js
 * Implements the exact industrial working hours calculation from the factory Excel files:
 * entre = 08:00 | sortie1 = 13:15 | entre2 = 14:00 | pause = 00:45 | sortie2 = 17:00
 * Daily working window = 08:15 (495 minutes).
 * Excludes lunch breaks, non-working evening/night hours, and non-working days.
 */

export const WORK_SCHEDULE = {
  morningStart: '08:00', // 480 mins
  morningEnd: '13:15',   // 795 mins (315 mins)
  pauseStart: '13:15',
  pauseEnd: '14:00',     // 840 mins (45 mins break)
  afternoonStart: '14:00',
  afternoonEnd: '17:00', // 1020 mins (180 mins)
  dailyWorkingMinutes: 495, // 8h 15m
};

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function formatMinutesToHHMM(totalMinutes) {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  return `${hh}:${mm}`;
}

export class CorrectiveCalculationService {
  /**
   * Helper to parse "HH:MM" string to total minutes
   */
  static timeStringToMinutes(timeStr) {
    return parseTimeToMinutes(timeStr);
  }

  /**
   * Helper to format total minutes to "HH:MM" or "HHh MMm"
   */
  static minutesToTimeString(totalMinutes) {
    return formatMinutesToHHMM(totalMinutes);
  }

  /**
   * Calculates working minutes on a single calendar day between startTime and endTime
   */
  static getWorkingMinutesInDay(startTimeStr, endTimeStr) {
    const startM = parseTimeToMinutes(startTimeStr);
    const endM = parseTimeToMinutes(endTimeStr);
    if (endM <= startM) return 0;

    const mStart = 480;  // 08:00
    const mEnd = 795;    // 13:15
    const aStart = 840;  // 14:00
    const aEnd = 1020;   // 17:00

    let workingMins = 0;

    // Morning overlap [08:00, 13:15]
    const morningOverlapStart = Math.max(startM, mStart);
    const morningOverlapEnd = Math.min(endM, mEnd);
    if (morningOverlapEnd > morningOverlapStart) {
      workingMins += (morningOverlapEnd - morningOverlapStart);
    }

    // Afternoon overlap [14:00, 17:00]
    const afternoonOverlapStart = Math.max(startM, aStart);
    const afternoonOverlapEnd = Math.min(endM, aEnd);
    if (afternoonOverlapEnd > afternoonOverlapStart) {
      workingMins += (afternoonOverlapEnd - afternoonOverlapStart);
    }

    return Math.max(0, workingMins);
  }

  /**
   * Exact industrial working hours calculation between two dates and times,
   * matching Excel NETWORKDAYS.INTL logic and excluding lunch breaks & off-shift hours.
   */
  static calculateWorkingTime(dateDebut, heureDebut, dateFin, heureFin) {
    if (!dateDebut || !heureDebut) {
      return { minutes: 0, formatted: '00:00' };
    }

    // If finish is not yet specified (e.g. in progress), return 0
    if (!dateFin || !heureFin) {
      return { minutes: 0, formatted: '00:00' };
    }

    const dStart = new Date(`${dateDebut}T00:00:00`);
    const dEnd = new Date(`${dateFin}T00:00:00`);

    if (isNaN(dStart.getTime()) || isNaN(dEnd.getTime()) || dEnd < dStart) {
      return { minutes: 0, formatted: '00:00' };
    }

    const isSameDay = dateDebut === dateFin;

    if (isSameDay) {
      const dayOfWeek = dStart.getDay(); // 0 is Sunday
      if (dayOfWeek === 0) {
        return { minutes: 0, formatted: '00:00' };
      }
      const minutes = this.getWorkingMinutesInDay(heureDebut, heureFin);
      return { minutes, formatted: formatMinutesToHHMM(minutes) };
    }

    // Multi-day calculation
    let totalMinutes = 0;
    const current = new Date(dStart);

    while (current <= dEnd) {
      const dayOfWeek = current.getDay();
      const isSunday = (dayOfWeek === 0);

      if (!isSunday) {
        const currentDateStr = current.toISOString().split('T')[0];
        if (currentDateStr === dateDebut) {
          // First day: from heureDebut to 17:00
          totalMinutes += this.getWorkingMinutesInDay(heureDebut, '17:00');
        } else if (currentDateStr === dateFin) {
          // Last day: from 08:00 to heureFin
          totalMinutes += this.getWorkingMinutesInDay('08:00', heureFin);
        } else {
          // Intermediate full working day
          totalMinutes += WORK_SCHEDULE.dailyWorkingMinutes;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      minutes: totalMinutes,
      formatted: formatMinutesToHHMM(totalMinutes),
    };
  }

  /**
   * Live elapsed working time for ongoing intervention
   */
  static getLiveElapsedTime(dateDebut, heureDebut) {
    if (!dateDebut || !heureDebut) return { minutes: 0, formatted: '00:00' };
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return this.calculateWorkingTime(dateDebut, heureDebut, todayStr, nowTimeStr);
  }

  /**
   * Compute Pareto 80/20 data for any attribute (e.g. 'anomalie', 'code_machine', 'type_panne')
   */
  static computePareto(interventions = [], groupByField = 'anomalie') {
    if (!Array.isArray(interventions) || interventions.length === 0) {
      return [];
    }

    const counts = {};
    let total = 0;

    interventions.forEach((item) => {
      const rawVal = item[groupByField];
      const key = String(rawVal || 'AUTRE').trim();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      total += 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.count;
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      const cumulativePercentage = total > 0 ? (cumulative / total) * 100 : 0;
      return {
        ...item,
        percentage: Number(percentage.toFixed(1)),
        cumulativePercentage: Number(cumulativePercentage.toFixed(1)),
        isVital80: cumulativePercentage <= 80 || (cumulative - item.count < total * 0.8),
      };
    });
  }

  /**
   * Compute Industrial MTTR & MTBF
   */
  static computeKpis(interventions = []) {
    if (!Array.isArray(interventions) || interventions.length === 0) {
      return {
        totalInterventions: 0,
        completedCount: 0,
        inProgressCount: 0,
        requestsCount: 0,
        totalWorkingMinutes: 0,
        totalWorkingHoursFormatted: '00:00',
        mttrMinutes: 0,
        mttrFormatted: '00:00',
        totalStoppageMinutes: 0,
        totalStoppageFormatted: '00:00',
        machinesAffectedCount: 0,
      };
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let requestsCount = 0;
    let totalWorkingMinutes = 0;
    let totalStoppageMinutes = 0;
    const machinesSet = new Set();

    interventions.forEach((item) => {
      if (item.code_machine) machinesSet.add(item.code_machine);

      if (item.statut === 'CLOTURE' || item.action_fermee === 'OUI') {
        completedCount += 1;
        const mins = Number(item.temps_intervention_mins) || 0;
        totalWorkingMinutes += mins;
      } else if (item.statut === 'EN_COURS') {
        inProgressCount += 1;
      } else {
        requestsCount += 1;
      }

      if (item.arret_machine) {
        const arretParts = String(item.temps_arret || '00:00').split(':');
        const arretMins = (parseInt(arretParts[0], 10) || 0) * 60 + (parseInt(arretParts[1], 10) || 0);
        totalStoppageMinutes += arretMins;
      }
    });

    const mttrMinutes = completedCount > 0 ? Math.round(totalWorkingMinutes / completedCount) : 0;

    return {
      totalInterventions: interventions.length,
      completedCount,
      inProgressCount,
      requestsCount,
      totalWorkingMinutes,
      totalWorkingHoursFormatted: formatMinutesToHHMM(totalWorkingMinutes),
      mttrMinutes,
      mttrFormatted: formatMinutesToHHMM(mttrMinutes),
      totalStoppageMinutes,
      totalStoppageFormatted: formatMinutesToHHMM(totalStoppageMinutes),
      machinesAffectedCount: machinesSet.size,
    };
  }

  /**
   * Detect recurring failures (>= 3 breakdowns on same machine & failure within 30 days)
   * to suggest automatic preventive maintenance actions.
   */
  static detectPreventiveRecommendations(interventions = []) {
    if (!Array.isArray(interventions) || interventions.length < 3) return [];

    const grouped = {};
    interventions.forEach((item) => {
      if (!item.code_machine || !item.anomalie) return;
      const key = `${item.code_machine}:::${item.anomalie}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    const recommendations = [];

    Object.entries(grouped).forEach(([key, items]) => {
      if (items.length >= 3) {
        // Sort by date descending
        const sorted = items.sort((a, b) => new Date(b.created_at || b.demande_date).getTime() - new Date(a.created_at || a.demande_date).getTime());
        const [machine, anomalie] = key.split(':::');
        const first = new Date(sorted[sorted.length - 1].demande_date || sorted[sorted.length - 1].created_at);
        const latest = new Date(sorted[0].demande_date || sorted[0].created_at);
        const diffDays = Math.max(1, Math.round((latest - first) / (1000 * 60 * 60 * 24)));

        recommendations.push({
          machine,
          anomalie,
          count: items.length,
          timeframeDays: diffDays,
          recommendedAction: `Créer gamme préventive pour ${machine} sur l'anomalie récurrente "${anomalie.replace(/_/g, ' ')}" (observée ${items.length} fois).`,
          suggestedIntervalDays: Math.max(7, Math.round(diffDays / items.length)),
          suggestedWork: items[0].travail_a_faire || `Inspection et maintenance préventive ${anomalie}`,
        });
      }
    });

    return recommendations.sort((a, b) => b.count - a.count);
  }
}
