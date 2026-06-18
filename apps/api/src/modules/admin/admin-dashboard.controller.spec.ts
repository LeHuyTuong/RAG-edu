import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminService } from './admin.service';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  const adminServiceMock = {
    getDashboardStats: jest.fn().mockReturnValue({
      message: 'Admin dashboard stats fetched successfully',
      data: {},
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminDashboardController(
      adminServiceMock as unknown as AdminService,
    );
  });

  it('delegates dashboard stats to AdminService', () => {
    expect(controller.getDashboardStats()).toEqual({
      message: 'Admin dashboard stats fetched successfully',
      data: {},
    });
    expect(adminServiceMock.getDashboardStats).toHaveBeenCalledWith();
  });

  it('restricts dashboard stats to ADMIN role', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, controller.getDashboardStats),
    ).toEqual([UserRole.ADMIN]);
  });
});
