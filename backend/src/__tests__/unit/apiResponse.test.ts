import { describe, it, expect } from 'vitest';
import { sendSuccess, sendError, sendPaginated } from '../../lib/apiResponse';

// Mock Response object
function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe('apiResponse', () => {
  describe('sendSuccess', () => {
    it('should send a success response with default 200 status', () => {
      const res = createMockRes();
      sendSuccess(res, { id: 1, name: 'Test' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
        error: null,
      });
    });

    it('should send a success response with custom status code', () => {
      const res = createMockRes();
      sendSuccess(res, { id: 1 }, 201);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle null data', () => {
      const res = createMockRes();
      sendSuccess(res, null);

      expect(res.body.data).toBeNull();
      expect(res.body.success).toBe(true);
    });
  });

  describe('sendError', () => {
    it('should send an error response with default 400 status', () => {
      const res = createMockRes();
      sendError(res, 'Something went wrong');

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        success: false,
        data: null,
        error: 'Something went wrong',
      });
    });

    it('should send an error response with custom status code', () => {
      const res = createMockRes();
      sendError(res, 'Not found', 404);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response with correct meta', () => {
      const res = createMockRes();
      const data = [{ id: 1 }, { id: 2 }];
      sendPaginated(res, data, { page: 1, limit: 10, total: 25 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });
});
