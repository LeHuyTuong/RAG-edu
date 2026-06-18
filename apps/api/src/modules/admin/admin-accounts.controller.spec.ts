import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AccountsService } from '../accounts/accounts.service';
import { AdminAccountsController } from './admin-accounts.controller';

describe('AdminAccountsController', () => {
  let controller: AdminAccountsController;

  const accountsServiceMock = {
    createModerator: jest.fn().mockReturnValue('created'),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockReturnValue('one'),
    ban: jest.fn().mockReturnValue({ message: 'Account banned successfully' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminAccountsController(
      accountsServiceMock as unknown as AccountsService,
    );
  });

  it('delegates create to AccountsService.createModerator', () => {
    const dto = { email: 'mod@example.com' } as any;

    expect(controller.create(dto)).toBe('created');
    expect(accountsServiceMock.createModerator).toHaveBeenCalledWith(dto);
  });

  it('delegates list, detail and ban to AccountsService', async () => {
    const query = { createdFrom: '2026-06-01' };

    await expect(controller.findAll(query)).resolves.toEqual([]);
    expect(controller.findOne('acc-1')).toBe('one');
    expect(controller.ban('acc-1')).toEqual({
      message: 'Account banned successfully',
    });

    expect(accountsServiceMock.findAll).toHaveBeenCalledWith(query);
    expect(accountsServiceMock.findOne).toHaveBeenCalledWith('acc-1');
    expect(accountsServiceMock.ban).toHaveBeenCalledWith('acc-1');
  });

  it('restricts admin account endpoints to ADMIN role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.create)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.findAll)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.findOne)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.ban)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});
