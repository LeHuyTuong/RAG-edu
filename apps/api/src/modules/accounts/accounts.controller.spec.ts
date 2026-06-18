import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

describe('AccountsController', () => {
  let controller: AccountsController;
  const accountsServiceMock = {
    findMe: jest.fn().mockReturnValue('me'),
    update: jest.fn().mockReturnValue('updated'),
    remove: jest.fn().mockReturnValue('removed'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AccountsController(
      accountsServiceMock as unknown as AccountsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findMe/update/remove for self-service', () => {
    const user = { sub: 'acc-1' } as any;

    expect(controller.findMe(user)).toBe('me');
    expect(controller.update('5', {} as any, user)).toBe('updated');
    expect(controller.remove('5', user)).toBe('removed');
    expect(accountsServiceMock.findMe).toHaveBeenCalledWith('acc-1');
    expect(accountsServiceMock.update).toHaveBeenCalledWith('5', {}, 'acc-1');
    expect(accountsServiceMock.remove).toHaveBeenCalledWith('5', 'acc-1');
  });

  it('should restrict self-service endpoints to USER, ADMIN, and MODERATOR roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.findMe)).toEqual([
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.MODERATOR,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.update)).toEqual([
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.MODERATOR,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.remove)).toEqual([
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.MODERATOR,
    ]);
  });
});
