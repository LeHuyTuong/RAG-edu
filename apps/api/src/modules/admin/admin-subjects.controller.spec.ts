import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { SubjectsService } from '../subjects/subjects.service';
import { AdminSubjectsController } from './admin-subjects.controller';

describe('AdminSubjectsController', () => {
  let controller: AdminSubjectsController;

  const subjectsServiceMock = {
    create: jest.fn().mockResolvedValue({ id: 's1' }),
    update: jest.fn().mockResolvedValue({ id: 's1' }),
    delete: jest.fn().mockResolvedValue({ message: 'Subject deleted' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminSubjectsController(
      subjectsServiceMock as unknown as SubjectsService,
    );
  });

  it('delegates subject mutations to SubjectsService', async () => {
    const createDto = { name: 'Math', code: 'MTH101' } as any;
    const updateDto = { name: 'Physics' } as any;

    await controller.create(createDto);
    await controller.update('s1', updateDto);
    await controller.remove('s1');

    expect(subjectsServiceMock.create).toHaveBeenCalledWith(createDto);
    expect(subjectsServiceMock.update).toHaveBeenCalledWith('s1', updateDto);
    expect(subjectsServiceMock.delete).toHaveBeenCalledWith('s1');
  });

  it('restricts admin subject endpoints to ADMIN role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.create)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.update)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.remove)).toEqual([
      UserRole.ADMIN,
    ]);
  });
});
