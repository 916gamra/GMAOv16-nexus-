export const STORAGE_KEY_PLANS = 'gmao_preventive_plans_v2';
export const INITIAL_PLANS = [];

export class PlanService {
  static getPlans() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PLANS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    this.savePlans(INITIAL_PLANS);
    return INITIAL_PLANS;
  }

  static savePlans(plans) {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    } catch {
      // storage error
    }
  }

  static deletePlan(id) {
    const current = this.getPlans();
    const filtered = current.filter(p => p.id !== id);
    this.savePlans(filtered);
    return filtered;
  }
}

export default PlanService;
