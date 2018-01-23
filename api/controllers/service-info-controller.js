const DtoMapper = require('../mapper/dto-mapper').DtoMapper;
const ServiceInfoService = require('../service/service-info-service')
  .ServiceInfoService;
const log = require('../utilities/logger');

async function saveServiceInfo(req, res, next) {
  try {
    const serviceInfo = DtoMapper.convertDtoToServiceInfoModel({
      id: req.params.id,
      data: req.body
    });
    log.info(serviceInfo);
    await ServiceInfoService.saveServiceInfo(serviceInfo);

    const updatedServiceInfo = await ServiceInfoService.getServiceInfoById(serviceInfo.id);

    const response = {
      result: 'OK',
      error: { message: '' },
      data: DtoMapper.mapServiceInfoToDto(updatedServiceInfo),
    };

    return res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  saveServiceInfo
};
