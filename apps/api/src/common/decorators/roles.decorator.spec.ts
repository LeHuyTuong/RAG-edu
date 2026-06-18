import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles decorator', () => {
  it('Roles returns a decorator function', () => {
    const dec = Roles('ADMIN');
    expect(typeof dec).toBe('function');
  });

  it('exports ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
