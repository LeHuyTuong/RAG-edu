import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

describe('SubjectsController', () => {
  let controller: SubjectsController;

  const subjectsServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SubjectsController(
      subjectsServiceMock as unknown as SubjectsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll service', async () => {
    subjectsServiceMock.findAll.mockResolvedValue([]);

    await controller.findAll({} as any);

    expect(subjectsServiceMock.findAll).toHaveBeenCalled();
  });

  it('should call findOne service', async () => {
    subjectsServiceMock.findOne.mockResolvedValue({ id: 's1' });

    await controller.findOne('s1');

    expect(subjectsServiceMock.findOne).toHaveBeenCalledWith('s1');
  });

  it('should propagate service NotFound errors', async () => {
    subjectsServiceMock.findOne.mockImplementationOnce(() =>
      Promise.reject(new (require('@nestjs/common').NotFoundException)('x')),
    );

    await expect(controller.findOne('s1')).rejects.toThrow();
  });
});
