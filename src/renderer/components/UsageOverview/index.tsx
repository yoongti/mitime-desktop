import {
  Paper,
  RingProgress,
  SegmentedControl,
  Text,
  Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { IGetUsageOverviewRes, IUsageOverview } from 'entity/usage-overview';
import { useEffect, useMemo, useState } from 'react';
import { stringToColour } from 'utils/color';
import { formatDuration } from 'utils/duration';
import './index.scss';

enum Period {
  Month,
  Week,
  Day,
}

const UsageOverview = () => {
  dayjs.extend(utc);

  const [overview, setOverview] = useState<IUsageOverview[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(Period.Day.toString());
  const [totalAppUsage, setTotalAppUsage] = useState(0);

  const initialRingLabel = useMemo(
    () => (
      <>
        <Text size="sm" align="center">
          App Usage
        </Text>
        <Text size="sm" align="center">
          {formatDuration(totalAppUsage, 'hour')}
        </Text>
      </>
    ),
    [totalAppUsage]
  );

  const [ringLabel, setRingLabel] = useState(initialRingLabel);

  const resetHover = () => {
    setRingLabel(initialRingLabel);
  };

  const getTotalAppUsage = (localOverview: IUsageOverview[]) => {
    return localOverview.reduce((prev, cur) => {
      return prev + cur['SUM(duration)'];
    }, 0);
  };

  const getUsageOverviewPercent = (localOverview: IUsageOverview[]) => {
    if (!localOverview || localOverview.length === 0) {
      return [];
    }

    const totalDuration = getTotalAppUsage(localOverview);

    return localOverview.map((item) => {
      const percent = (item['SUM(duration)'] / totalDuration) * 100;
      return {
        value: percent,
        color: stringToColour(item.app_name),
        onMouseEnter: () => {
          setRingLabel(
            <>
              <Text size="sm" align="center">
                {item.app_name}
              </Text>
              <Text size="sm" align="center">
                {formatDuration(item['SUM(duration)'], 'hour')}
              </Text>
              <Text size="sm" align="center">
                ({percent.toFixed(2)}%)
              </Text>
            </>
          );
        },
        onMouseLeave: resetHover,
      };
    });
  };

  useEffect(() => {
    window.electron.ipcRenderer.on('get-usage-overview', (arg) => {
      const data = arg as IGetUsageOverviewRes;
      setOverview(data.result);
      setTotalAppUsage(getTotalAppUsage(data.result));
    });
  }, []);

  useEffect(() => {
    setRingLabel(initialRingLabel);
  }, [totalAppUsage, initialRingLabel]);

  useEffect(() => {
    let startDate = dayjs.utc().subtract(1, 'day');
    const endDate = dayjs.utc();
    if (selectedPeriod === Period.Week.toString()) {
      startDate = endDate.subtract(1, 'week');
    } else if (selectedPeriod === Period.Month.toString()) {
      startDate = endDate.subtract(1, 'month');
    }

    window.electron.ipcRenderer.sendMessage('get-usage-overview', {
      start_date: startDate.format(),
      end_date: endDate.format(),
    });
  }, [selectedPeriod]);

  return (
    <div className="overview">
      <Paper shadow="sm" p="xl" radius={8} m={16}>
        <div className="overview-header">
          <Title order={2}>Stats</Title>
          <SegmentedControl
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            data={[
              {
                label: 'Day',
                value: Period.Day.toString(),
              },
              {
                label: 'Week',
                value: Period.Week.toString(),
              },
              {
                label: 'Month',
                value: Period.Month.toString(),
              },
            ]}
          />
        </div>
        <div className="overview-body">
          <RingProgress
            label={
              <Text size="sm" align="center">
                {ringLabel}
              </Text>
            }
            onMouseLeave={() => setRingLabel(initialRingLabel)}
            size={280}
            thickness={28}
            sections={getUsageOverviewPercent(overview)}
          />
        </div>
      </Paper>
    </div>
  );
};

export default UsageOverview;