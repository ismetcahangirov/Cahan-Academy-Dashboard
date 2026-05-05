import { describe, it, expect, vi } from 'vitest';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import User from '../../models/userModel.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  describe('protect', () => {
    it('should set req.user if token is valid', async () => {
      const mockUser = { _id: '123', status: 'active', name: 'Test' };
      vi.spyOn(jwt, 'verify').mockReturnValue({ id: '123' });
      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser)
      });

      const req = { headers: { authorization: 'Bearer validtoken' } };
      const res = {};
      const next = vi.fn();

      await protect(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('should return 401 if no token provided', async () => {
      const req = { headers: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('authorize', () => {
    it('should call next if user has correct role', () => {
      const req = { user: { role: 'admin' } };
      const res = {};
      const next = vi.fn();

      authorize('admin', 'teacher')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user lacks role', () => {
      const req = { user: { role: 'student' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      authorize('admin', 'teacher')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
