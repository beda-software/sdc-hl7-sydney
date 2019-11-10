import moment from "moment";

export const humanDate = "MM.DD.YYYY";
export const humanTime = "HH:mm";
export const humanDateTime = "MM.DD.YYYY HH:mm";

export const FHIRTime = "HH:mm:ss";
export const FHIRDate = "YYYY-MM-DD";
export const FHIRDateTime = "YYYY-MM-DDTHH:mm:ss[Z]";

export const formatFHIRTime = (date: Date | moment.Moment) =>
  moment(date).format(FHIRTime);
export const formatFHIRDate = (date: Date | moment.Moment) =>
  moment(date).format(FHIRDate);
export const formatFHIRDateTime = (date: Date | moment.Moment) =>
  moment(date)
    .utc()
    .format(FHIRDateTime);

// parseFHIR* functions return moment instance in local timezone
export const parseFHIRTime = (date: string) => moment(date, FHIRTime);
export const parseFHIRDate = (date: string) => moment(date, FHIRDate);
export const parseFHIRDateTime = (date: string) =>
  moment.utc(date, FHIRDateTime).local();

export const formatHumanDateTime = (date?: string) => {
  if (!date) {
    return "";
  }

  return parseFHIRDateTime(date).format(humanDateTime);
};
export const formatHumanDate = (date?: string) => {
  if (!date) {
    return "";
  }

  if (date.length === FHIRDate.length) {
    return parseFHIRDate(date).format(humanDate);
  }

  return parseFHIRDateTime(date).format(humanDate);
};
export const formatHumanTime = (date?: string) => {
  if (!date) {
    return "";
  }

  if (date.length === FHIRTime.length) {
    return parseFHIRTime(date).format(humanTime);
  }

  return parseFHIRDateTime(date).format(humanTime);
};

export const calcAge = (date?: string) => {
  if (date) {
    const age = moment().diff(moment(date, "YYYY-MM-DD"), "years");
    return age + " y.o.";
  }
  return null;
};

export const makeFHIRDateTime = (date: string, time = "00:00:00") =>
  formatFHIRDateTime(moment(`${date}T${time}`, `${FHIRDate}T${FHIRTime}`));
export const extractFHIRDate = (date: string) => {
  if (date.length === FHIRDate.length) {
    return date;
  }

  return formatFHIRDate(parseFHIRDateTime(date));
};
export const isFHIRDateEqual = (date1: string, date2: string) =>
  extractFHIRDate(date1) === extractFHIRDate(date2);

export const getFHIRCurrentDate = () => formatFHIRDate(moment());
export const getFHIRCurrentDateTime = () => formatFHIRDateTime(moment());
export const getFHIRCurrentDateTimeMin = () =>
  formatFHIRDateTime(moment().set({ hours: 0, minutes: 0, seconds: 0 }));
export const getFHIRCurrentDateTimeMax = () =>
  formatFHIRDateTime(moment().set({ hours: 23, minutes: 59, seconds: 59 }));
