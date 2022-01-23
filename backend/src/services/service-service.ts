import { Model } from 'sequelize';
import GeneralService from './general-service';
import comboService from './combo-service';
import serviceEmployeeService from './service-employee-service';
import { IService, IServicesDto, IServiceDto } from '../interfaces/IService';
import sequelize from "src/modules/sequelize";

class ServiceService extends GeneralService<IService, IServicesDto> {
  private readonly employeeModel: any;

  constructor(
      serviceModelName: string,
      employeeModelName: string,
  ) {
    super(serviceModelName);
    this.employeeModel = sequelize.model(employeeModelName)
  }

  async getAllValidItems(): Promise<IService[]> {
    try {
      const allItems = await this.model.findAll({
        where: {
          hidden: false,
        },
        include: this.employeeModel
      });
      return allItems.map((item: Model) => {
        return item.toJSON() as IService;
      });
    } catch (error) {
      console.error('ServiceService/getAllValidItems()/ERROR: ', error);
      throw error;
    }
  }

  /*
  * this method will create a series of services based on given durations and prices
  * @param itemInfo service information in the type of IServicesDto
  * @return newServices a series of services created based on the given itemInfo
  * */
  async createItems(itemInfo: IServicesDto): Promise<IService[]> {
    console.log('createItem()/itemInfo: ', itemInfo);
    const t = await sequelize.transaction();
    try {
      const { employee_ids, durations_prices, ...serviceInfo } = itemInfo;
      let newServices: IService[] = [];
      for (const durationsPrice of durations_prices) {
        if (durationsPrice.id) delete durationsPrice.id;
        const newService = await this.model.create({ ...serviceInfo, ...durationsPrice}, { transaction: t });
        if (employee_ids) {
          console.log('createItem()/employee_ids: ', employee_ids);
          for (const employeeId of employee_ids) {
            const employeeItem = await this.employeeModel.findByPk(employeeId);
            await newService.addEmployee(employeeItem, { transaction: t });
          }
        }
        const savedService = (await this.model.findByPk(
            newService.getDataValue('id'),
            {
              include: this.employeeModel,
              transaction: t
            }
        )).toJSON() as IService;
        newServices.push(savedService);
      }
      await t.commit();
      return newServices;
    } catch (error) {
      console.error('ServiceService/createItem()/ERROR: ', error);
      await t.rollback();
      throw error;
    }
  }

  async getItemById(id: string): Promise<IService> {
    try {
      return (await this.model.findByPk(id, { include: this.employeeModel })).toJSON() as IService;
    } catch (error) {
      console.error('ServiceService/getItemById()/ERROR: ', error);
      throw error;
    }
  }

  /*
  * this method will update the services based on given info,
  * it may create new services, or delete(hide) existing service
  * if a service is deleted, the related combo, service-combo, service-employee will also be deleted
  * @param serviceObj including basic service info and an array of durations_prices which specifies the affected servcies
  * @return updatedServices: IService[] the services with updated info
  * */
  async updateItems(serviceObj: IServicesDto): Promise<IService[]> {
    const t = await sequelize.transaction();
    try {
      const { employee_ids, durations_prices, name, service_code, ...otherInfo } = serviceObj;
      // load employees
      let allEmployees: Model[] = [];
      if (employee_ids) {
        for (const employeeId of employee_ids) {
          const employeeItem = await this.employeeModel.findByPk(employeeId);
          allEmployees.push(employeeItem);
        }
      }

      let updateIds = [];
      for (const dp of durations_prices) {
        if (dp.id) updateIds.push(dp.id);
        // without an id, it is a new service, add it
        else {
          const serviceInfo: IServiceDto = {
            name: name,
            service_code: service_code,
            ...otherInfo,
            ...dp
          };
          const newService = await this.model.create(serviceInfo, { transaction: t });
          for (const employeeItem of allEmployees) {
            newService.addEmployee(employeeItem, { transaction: t });
          }
        }
      }

      // there is at least one service to be updated
      if (updateIds.length > 0) {
        const sampleService = await this.getItemById(updateIds[0]);
        const allServices = await this.model.findAll({
          where: {
            name: sampleService.name,
            service_code: sampleService.service_code,
            hidden: false
          }
        });
        // if any service has been delete - if yes, delete corresponding combo, service-combo, and service-employee
        for (const service of allServices) {
          const serviceId = service.getDataValue('id');
          if (!updateIds.includes(serviceId)) {
            console.log('hide the service of id: ', serviceId);
            // hide the service
            await this.model.update({ hidden: true }, {
              where: {
                id: serviceId
              },
              transaction: t
            });
            // delete combos and service-combo items
            await comboService.deleteItemsByServiceId(serviceId, t);
            // delete service-employee items
            await serviceEmployeeService.deleteItemByServiceId(serviceId, t);
          }
          else {
            console.log('update the service of id: ', serviceId)
            // the service exists ==> update the service
            // update basic info
            const durationPrice = durations_prices.filter((dp) => {
              return serviceId === dp.id;
            })
            await service.update(
                {
                  name: name,
                  service_code: service_code,
                  ...otherInfo,
                  ...durationPrice[0]
                },
                {
                  transaction: t
                }
            );
            // update service-employee relationship - delete old ones and add new ones
            await serviceEmployeeService.deleteItemByServiceId(serviceId, t);
            if (employee_ids) {
              for (const employeeId of employee_ids) {
                const employeeItem = await this.employeeModel.findByPk(employeeId);
                await service.addEmployee(employeeItem, { transaction: t });
              }
            }
          }
        }
      }

      await t.commit();
      let updatedServices = await this.model.findAll({
        where: {
          name: name,
          service_code: service_code,
          hidden: false
        },
        include: this.employeeModel
      });
      return updatedServices.map((service: Model) => (service.toJSON() as IService))
    } catch (error) {
      console.error('ServiceService/updateItem()/ERROR: ', error);
      await t.rollback();
      throw error;
    }
  }

  /*
  * this method will hide the 'deleted' service and delete all associated combos
  * @param serviceId the id of the service to be deleted
  * @return void will throw error if error occurs
  * */
  async deleteItemById(id: string): Promise<void> {
    const t = await sequelize.transaction();
    try {
      const numberOfDeletion = await this.model.destroy({
        where: {
          id: id,
        },
        transaction: t,
      });
      if (numberOfDeletion === 0) {
        throw new Error(`ERROR - no item has been found with the id: ${id}`);
      } else if (numberOfDeletion > 1) {
        throw new Error(
            `ERROR - database error, multiple items have been found with the id: ${id}`
        );
      } else {
        // todo - delete related combos and service-combo relationships

        await t.commit();
      }
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new ServiceService('service', 'employee');
