import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from '@/modules/upload/upload.controller';
import { UploadService } from '@/modules/upload/upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: UploadService;

  const mockUploadService = {
    uploadImage: jest.fn(),
    uploadSound: jest.fn(),
    deleteFile: jest.fn(),
  };

  const dummyReq = {
    user: { id: 'user-123', email: 'test@example.com', role: 'USER' },
  } as any;

  const dummyFile = {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('data'),
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should call uploadService.uploadImage', async () => {
    const mockRes = { id: 'img-1', url: 'http://localhost/img.png' } as any;
    mockUploadService.uploadImage.mockResolvedValue(mockRes);

    const res = await controller.uploadImage(dummyReq, dummyFile);
    expect(res).toBe(mockRes);
    expect(uploadService.uploadImage).toHaveBeenCalledWith('user-123', dummyFile);
  });

  it('should call uploadService.uploadSound', async () => {
    const mockRes = { id: 'sound-1', url: 'http://localhost/sound.mp3' } as any;
    mockUploadService.uploadSound.mockResolvedValue(mockRes);

    const res = await controller.uploadSound(dummyReq, dummyFile, 'Alert');
    expect(res).toBe(mockRes);
    expect(uploadService.uploadSound).toHaveBeenCalledWith('user-123', dummyFile, 'Alert');
  });

  it('should call uploadService.deleteFile', async () => {
    const mockRes = { filename: 'test.png', deleted: true };
    mockUploadService.deleteFile.mockResolvedValue(mockRes);

    const res = await controller.deleteFile(dummyReq, 'test.png');
    expect(res).toBe(mockRes);
    expect(uploadService.deleteFile).toHaveBeenCalledWith('user-123', 'test.png');
  });
});
