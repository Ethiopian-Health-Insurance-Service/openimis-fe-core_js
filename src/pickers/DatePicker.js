import React, { Component, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from "react-intl";
import { FormControl } from "@material-ui/core";
import { DatePicker as MUIDatePicker } from "@material-ui/pickers";
import { formatMessage, toISODate } from "../helpers/i18n";
import { withModulesManager, withHistory } from "@openimis/fe-core";

import DatePicker from "react-multi-date-picker";
import nepali from "../calendars/NepalCalendar";
import nepali_en from "../calendars/NepaliLocaleEn";
import nepali_np from "../calendars/NepaliLocaleNp";
import ethiopian from "../calendars/EthiopianCalendar";
import ethiopian_en from "../calendars/EthiopianLocaleEn";
import ethiopian_am from "../calendars/EthiopianLocaleAm";
import { EtCalendar } from "et-calendar-react";


import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

const styles = (theme) => ({
  label: {
    color: theme.palette.primary.main,
  },
});

function fromISODate(s) {
  if (!s) return null;
  return moment(s).toDate();
}

class openIMISDatePicker extends Component {
  state = {
    value: null,
  };

  componentDidMount() {
    this.setState((state, props) => ({ value: props.value || null }));
  }

  componentDidUpdate(prevState, prevProps, snapshot) {
    if (prevState.value !== this.props.value) {
      this.setState((state, props) => ({ value: fromISODate(props.value) }));
    }
  }

  dateChange = (d) => {
    this.setState({ value: toISODate(d) }, (i) => (!!this.props.onChange ? this.props.onChange(toISODate(d)) : null));
  };

  secondaryCalendarDateChange = (d) => {
    this.setState({ value: toISODate(d.toDate()) }, (i) =>
      !!this.props.onChange ? this.props.onChange(toISODate(d.toDate())) : null,
    );
  };

  ethiopianCalendarDateChange = (d) => {
    this.setState({ value: toISODate(d.toDate()) }, (i) =>
      !!this.props.onChange ? this.props.onChange(toISODate(d.toDate())) : null,
    );
  };

  clearDate = (e) => {
    e.preventDefault();
    this.setState({ value: null });
  };

  setMinDate = () => {
    const { disablePast, minDate } = this.props;

    return { minDate: this.moveByOneDay(disablePast ? new Date() : new Date(minDate)) };
  };

  secondaryCalendarsOptions = {
    "nepali": nepali,
    "ethiopian": ethiopian,
    "default": gregorian,
  };

  secondaryCalendarsLocaleOptions = {
    "nepali_en": nepali_en,
    "nepali_np": nepali_np,
    "ethiopian_en": ethiopian_en,
    "ethiopian_am": ethiopian_am,
    "default": gregorian_en,
  };

  getDictionaryValueOrDefault = (_dictionary, _key) => {
    return _key in _dictionary ? _dictionary[_key] : _dictionary["default"];
  };

  // for some reason multi-date-picker picks incorrect date
  // we need to add one day for it to works correctly
  // it is possible, that future release of library will fix it
  // making this method redundant
  moveByOneDay = (date) => {
    date.setDate(date.getDate() + 1);
    return date;
  };

  render() {
    const {
      intl,
      classes,
      disablePast,
      module,
      label,
      readOnly = false,
      required = false,
      fullWidth = true,
      format = "DD-MM-YYYY",
      reset,
      isSecondaryCalendarEnabled,
      modulesManager,
      minDate,
      maxDate,
      ...otherProps
    } = this.props;

    const enableEthiopianCalendar = modulesManager.getConf("fe-core", "enableEthiopianCalendar", true);

    if (isSecondaryCalendarEnabled) {
      const secondCalendarFormatting = modulesManager.getConf("fe-core", "secondCalendarFormatting", format);
      const secondCalendarType = modulesManager.getConf("fe-core", "secondCalendarType", "nepali");
      const secondCalendarLocale = modulesManager.getConf("fe-core", "secondCalendarLocale", "nepali_en");

      return (
        <FormControl fullWidth={fullWidth}>
          <label className={classes.label}>
            {!!label ? formatMessage(intl, module, label).concat(required ? " *" : "") : null}
          </label>
          <DatePicker
            format={secondCalendarFormatting}
            disabled={readOnly}
            value={this.state.value ? this.moveByOneDay(new Date(this.state.value)) : null}
            {...((!!minDate || disablePast) && this.setMinDate())}
            {...(!!maxDate && { maxDate: this.moveByOneDay(new Date(maxDate)) })}
            onChange={this.secondaryCalendarDateChange}
            highlightToday={false}
            calendar={this.getDictionaryValueOrDefault(this.secondaryCalendarsOptions, secondCalendarType)}
            locale={this.getDictionaryValueOrDefault(this.secondaryCalendarsLocaleOptions, secondCalendarLocale)}
          >
            <button style={{ margin: "5px" }} onClick={(e) => this.clearDate(e)}>
              {formatMessage(intl, "core", "calendar.clearButton")}
            </button>
          </DatePicker>
        </FormControl>
      );
    } else if (enableEthiopianCalendar) {
      return (
        <FormControl fullWidth={fullWidth}>
          <label className={classes.label}>
            {!!label ? formatMessage(intl, module, label).concat(required ? " *" : "") : null}
          </label>
          <EtCalendar
            value={this.state.value}
            onChange={this.dateChange}
            disabled={readOnly}
            minDate={minDate}
            maxDate={maxDate}
            calendarType={true}
            lang={"am"}
            placeholder={false}
            label={null}
          />
        </FormControl>
      );
    } else {
      return (
        <FormControl fullWidth={fullWidth}>
          <MUIDatePicker
            {...otherProps}
            maxDate={maxDate}
            minDate={minDate}
            format={format}
            disabled={readOnly}
            required={required}
            clearable
            value={this.state.value}
            InputLabelProps={{
              className: classes.label,
            }}
            label={!!label ? formatMessage(intl, module, label) : null}
            onChange={this.dateChange}
            disablePast={disablePast}
          />
        </FormControl>
      );
    }
  }
}

const mapStateToProps = (state) => ({
  isSecondaryCalendarEnabled: state.core.isSecondaryCalendarEnabled ?? false,
});

export default injectIntl(
  withModulesManager(withHistory(connect(mapStateToProps, null)(withTheme(withStyles(styles)(openIMISDatePicker))))),
);
