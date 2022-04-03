import React, { useRef, useCallback, forwardRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { http } from 'utils/http';
import { randomBytes } from 'crypto';
import { Typography } from '@mui/material';
import ColorHash from 'color-hash';

import {
  tuiThemeConfig,
  tuiTemplateConfig,
} from 'components/appointment/config';
import { AddAppointmentDialog } from 'components/appointment/AddAppointmentDialog';
import { AppointmentControls } from 'components/appointment/AppointmentControls';
import AppointmentStatusDialog from 'components/appointment/AppointmentStatusDialog';
import DropConfirmationDialog from 'components/appointment/dropConfirmationDialog';
import {
  ISchedule,
  IAppointmentResponse,
  ICalendar,
} from 'components/appointment/common/appointmentInterfaces';
import { generateSchedules } from 'components/appointment/common/generateSchedules';

import 'tui-calendar/dist/tui-calendar.css';

const colorHash = new ColorHash();
const TuiCalendarWrapper = dynamic(
  () => import('components/appointment/TuiCalendarWrapper'),
  { ssr: false }
);
const TuiCalendar: any = forwardRef((props, ref) => (
  <TuiCalendarWrapper {...props} forwardedRef={ref} />
));
TuiCalendar.displayName = 'TuiCalendar';

const appointmentApiPath = `/api/v1/appointments`;
const employeeApiPath = `/api/v1/employees`;
const customerApiPath = `/api/v1/customer`;
const serviceApiPath = `/api/v1/services`;

export async function getServerSideProps () {
  const appointmentList = await http(appointmentApiPath);
  const employeeList = await http(employeeApiPath);
  const customerList = (await http(customerApiPath)).map((c) => ({
    ...c,
    id: '' + c.id,
  }));
  const serviceList = await http(serviceApiPath);
  const initAppointments = appointmentList.map(
    (appm: IAppointmentResponse) => ({
    ...appm,
    feedback: appm.feedback || '',
    notes: appm.notes || 'insert memo here',
    status: JSON.parse(appm.status) || [],
    })
  );
  return {
    props: {
      initAppointments,
      employeeList,
      customerList,
      serviceList,
    },
  };
}

const Appointment = ({
  initAppointments,
  employeeList,
  customerList,
  serviceList,
}) => {
  const cal = useRef(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openDropDialog, setOpenDropDialog] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<
    IAppointmentResponse
  >(null);
  const [updateEvent, setUpdateEvent] = useState(null);

  const initAppointmentMap = new Map<string, IAppointmentResponse>();
  initAppointments.forEach((appm) => {
    initAppointmentMap.set(appm.id, appm);
  });

  const [appointmentMap, setAppointmentMap] = useState(initAppointmentMap);

  const onClickSchedule = useCallback(
    (e) => {
      const { id: appointmentId } = e.schedule;
      setSelectedAppointment(appointmentMap.get(appointmentId));

      setOpenStatusDialog(true);
    },
    [appointmentMap]
  );

  const onBeforeCreateSchedule = useCallback((scheduleData) => {
    const schedule = {
      id: String(randomBytes(8)),
      title: scheduleData.title,
      isAllDay: scheduleData.isAllDay,
      start: scheduleData.start,
      end: scheduleData.end,
      category: scheduleData.isAllDay ? 'allday' : 'time',
      dueDateClass: '',
      location: scheduleData.location,
      state: scheduleData.state,
    };

    cal.current.calendarInst.createSchedules([schedule]);
    // TODO: create schedule

    setOpenStatusDialog(true);
  }, []);

  const onBeforeDeleteSchedule = useCallback(
    async (event) => {
      const { id, calendarId } = event.schedule;

      cal.current.calendarInst.deleteSchedule(id, calendarId);

      await http(appointmentApiPath + '/' + id, { method: 'DELETE' });

      const newAppointmentMap = new Map(appointmentMap);
      newAppointmentMap.delete(id);
      setAppointmentMap(newAppointmentMap);
    },
    [appointmentMap]
  );

  const onBeforeUpdateSchedule = useCallback((e) => {
    setUpdateEvent(e);
    setOpenDropDialog(true);
  }, []);

  const handleConfirmUpdateSchedule = (ok) => {
    setOpenDropDialog(false);

    if (ok && updateEvent) {
      const { schedule, changes } = updateEvent;
      cal.current.calendarInst.updateSchedule(
        schedule.id,
        schedule.calendarId,
        changes
      );

      const oldSchedule = appointmentMap.get(schedule.id);
      let newDatetime = new Date(oldSchedule.datetime);
      let newDuration = oldSchedule.duration;
      if ('start' in changes) {
        newDatetime = new Date(changes.start);
      }
      if ('end' in changes) {
        newDuration = new Date(changes.end).getTime() - newDatetime.getTime();
        newDuration = Math.floor(newDuration / 1000 / 60);
      }
      editAppointment(oldSchedule, {
        datetime: newDatetime,
        duration: newDuration,
      });
    }

    setUpdateEvent(null);
  };

  const editAppointment = async (
    oldAppointment: IAppointmentResponse,
    changes: any
  ) => {
    const newAppointment = {
      ...appointmentMap.get(oldAppointment.id),
      ...changes,
    };
    setAppointmentMap(
      new Map(appointmentMap.set(oldAppointment.id, newAppointment))
    );

    await http(appointmentApiPath, {
      method: 'PUT',
      body: {
        ...newAppointment,
        employee_ids: newAppointment.employees.map((emp) => emp.id),
        service_ids: newAppointment.services.map((serv) => serv.id),
      },
    });
  };

  const onClickDayname = useCallback((e) => {
    const calendar = cal.current.calendarInst;
    if (calendar.getViewName() === 'day') {
      calendar.changeView('week', true);
    } else if (
      calendar.getViewName() === 'week' ||
      calendar.getViewName() === 'month'
    ) {
      const date = new Date(e.date);
      date.setDate(date.getDate() + 1);
      calendar.setDate(date);
      calendar.changeView('day', true);
    } else {
      return;
    }
    calendar.render();
  }, []);

  const changeCalendarView = (viewName) => {
    const calendar = cal.current.calendarInst;
    calendar.changeView(viewName, true);
    calendar.render();
  };

  const handleClickToday = () => {
    const calendar = cal.current.calendarInst;

    if (
      calendar.getDate().setHours(0, 0, 0, 0) !==
      new Date().setHours(0, 0, 0, 0)
    ) {
      calendar.today();
    } else {
      changeCalendarView('day');
    }
  };

  const calendarList: ICalendar[] = customerList.map((customer) => ({
    id: '' + customer.id,
    name: [
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.id,
    ].join(' '),
    color: 'white',
    bgColor: colorHash.hex('' + customer.id),
    dragBgColor: '#9e5fff',
    borderColor: '#9e5fff',
    visible: true,
  }));

  const handleFilterCalendar = (
    _event,
    selected,
    reason: 'selectOption' | 'clear'
  ) => {
    const tuiCal = cal.current.calendarInst;
    if (reason === 'selectOption') {
      calendarList.forEach((calendar) => {
        tuiCal.toggleSchedules(calendar.id, true, false);
      });
      tuiCal.toggleSchedules(selected.id, false, false);
    } else if (reason === 'clear') {
      calendarList.forEach((calendar) => {
        tuiCal.toggleSchedules(calendar.id, false, false);
      });
    }
    tuiCal.render();
  };

  const TuiCalendarProps = {
    ref: cal,
    view: 'day',
    taskView: false,
    scheduleView: ['time'],
    week: { hourStart: 8, hourEnd: 22 },
    useCreationPopup: false,
    useDetailPopup: false,
    theme: tuiThemeConfig,
    template: tuiTemplateConfig,
    calendars: calendarList,
    schedules: generateSchedules(initAppointments),
    onClickDayname: onClickDayname,
    onClickSchedule: onClickSchedule,
    onBeforeCreateSchedule: onBeforeCreateSchedule,
    onBeforeDeleteSchedule: onBeforeDeleteSchedule,
    onBeforeUpdateSchedule: onBeforeUpdateSchedule,
  };

  return (
    <>
      <Typography variant='h6'>Appointment</Typography>
      <AppointmentControls
        onClickToday={handleClickToday}
        onClickWeek={() => changeCalendarView('week')}
        onClickMonth={() => changeCalendarView('month')}
        onClickPrevButton={() => cal.current.calendarInst.prev()}
        onClickNextButton={() => cal.current.calendarInst.next()}
        calendars={calendarList}
        handleFilterCalendar={handleFilterCalendar}
        onClickNewAppointment={() => setOpenCreateDialog(true)}
      />
      <TuiCalendar {...TuiCalendarProps} />
      <AppointmentStatusDialog
        editAppointment={editAppointment}
        deleteAppointment={onBeforeDeleteSchedule}
        target={selectedAppointment}
        isOpen={openStatusDialog}
        onClose={() => {
          setOpenStatusDialog(false);
          setSelectedAppointment(null);
        }}
      />
      <AddAppointmentDialog
        isOpen={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false);
        }}
        therapists={employeeList}
        services={serviceList}
      />
      <DropConfirmationDialog
        open={openDropDialog}
        onClose={handleConfirmUpdateSchedule}
        changes={updateEvent?.changes}
      />
    </>
  );
};

export default Appointment;
