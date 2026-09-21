import { DatabaseService } from '../../core/database/DatabaseService.js';
import { Logger } from '../../core/logger/LoggerService.js';

/**
 * Pagination Service
 * ✅ تقسيم النتائج إلى صفحات
 */
export class PaginationService {
  /**
   * Paginate query results
   */
  static paginate(query, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const countQuery = query.replace(/SELECT .* FROM/i, 'SELECT COUNT(*) as count FROM');
      const db = new DatabaseService();
      const countResult = db.queryOne(countQuery);
      const total = countResult.count;

      // Get paginated data
      const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
      const data = db.query(paginatedQuery, [limit, offset]);

      const pages = Math.ceil(total / limit);
      const hasMore = page < pages;

      Logger.debug('📄 Pagination', { page, limit, total, pages });

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasMore,
          offset
        }
      };
    } catch (error) {
      Logger.error('❌ Pagination failed', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0,
          hasMore: false,
          offset: 0
        }
      };
    }
  }

  /**
   * Get next page number
   */
  static getNextPage(currentPage, totalPages) {
    if (currentPage >= totalPages) return null;
    return currentPage + 1;
  }

  /**
   * Get previous page number
   */
  static getPreviousPage(currentPage) {
    if (currentPage <= 1) return null;
    return currentPage - 1;
  }
}
