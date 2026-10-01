/**
 * 📊 نظام مراقبة وتتبع أداء العمليات واستخدام الذاكرة (Performance & Resource Monitor)
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      slow: 1000,
      verySlow: 3000,
      critical: 5000
    };
    this.alerts = [];
  }

  /**
   * قياس زمن تنفيذ واستهلاك الذاكرة لعملية معينة
   */
  async measure(operationName, fn, metadata = {}) {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const endMemory = this.getMemoryUsage();

      this.recordMetric(operationName, {
        duration,
        memoryDelta: endMemory - startMemory,
        status: 'success',
        timestamp: new Date().toISOString(),
        metadata
      });

      this.checkThresholds(operationName, duration);

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric(operationName, {
        duration,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        metadata
      });

      throw error;
    }
  }

  /**
   * تسجيل القياس في كشوفات المراقبة
   */
  recordMetric(name, metric) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name);
    metrics.push(metric);

    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  /**
   * التحقق من تخطي الحدود المسموحة والأداء البطين
   */
  checkThresholds(operationName, duration) {
    let severity = 'normal';
    let message = '';

    if (duration > this.thresholds.critical) {
      severity = 'critical';
      message = `🚨 عملية حرجة البطء: ${operationName} استغرقت ${duration.toFixed(2)}ms`;
    } else if (duration > this.thresholds.verySlow) {
      severity = 'warning';
      message = `⚠️ عملية بطيئة جداً: ${operationName} استغرقت ${duration.toFixed(2)}ms`;
    } else if (duration > this.thresholds.slow) {
      severity = 'info';
      message = `ℹ️ عملية بطيئة: ${operationName} استغرقت ${duration.toFixed(2)}ms`;
    }

    if (severity !== 'normal') {
      console.warn(message);
      this.alerts.push({
        timestamp: new Date().toISOString(),
        severity,
        message,
        operationName,
        duration
      });
    }
  }

  /**
   * حساب الإحصائيات الرياضية (Mean, Median, P95, P99)
   */
  getStats(operationName) {
    const metrics = this.metrics.get(operationName) || [];
    if (metrics.length === 0) return null;

    const durations = metrics
      .filter(m => m.status === 'success')
      .map(m => m.duration);

    if (durations.length === 0) return null;

    const sorted = durations.sort((a, b) => a - b);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: metrics.length,
      avg: avg.toFixed(2),
      median: median.toFixed(2),
      min: Math.min(...durations).toFixed(2),
      max: Math.max(...durations).toFixed(2),
      p95: p95.toFixed(2),
      p99: p99.toFixed(2),
      errors: metrics.filter(m => m.status === 'error').length
    };
  }

  /**
   * الحصول على حجم استخدام الذاكرة بالـ MB
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / 1048576;
    }
    return 0;
  }

  /**
   * طباعة تقرير الأداء الشامل في منصة المطورين
   */
  printReport() {
    console.group('📊 تقرير أداء GMAO');
    const data = Array.from(this.metrics.keys()).map(name => ({
      'العملية': name,
      'المتوسط (ms)': this.getStats(name)?.avg || 'N/A',
      'الوسيط (ms)': this.getStats(name)?.median || 'N/A',
      'P95 (ms)': this.getStats(name)?.p95 || 'N/A',
      'العدد': this.getStats(name)?.count || 0
    }));
    console.table(data);
    console.groupEnd();
  }

  /**
   * تصدير تقرير الأداء كملف JSON
   */
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      operations: {},
      memory: {
        current: this.getMemoryUsage(),
        unit: 'MB'
      },
      alerts: this.alerts.slice(-50)
    };

    for (const [name] of this.metrics) {
      report.operations[name] = this.getStats(name);
    }

    if (typeof document !== 'undefined') {
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
