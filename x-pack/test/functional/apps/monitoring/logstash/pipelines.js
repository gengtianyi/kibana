/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const overview = getService('monitoringClusterOverview');
  const pipelinesList = getService('monitoringLogstashPipelines');
  const lsClusterSummaryStatus = getService('monitoringLogstashSummaryStatus');

  describe('Logstash pipelines', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/logstash-pipelines', {
        from: '2018-01-22 9:10:00.000',
        to: '2018-01-22 9:41:00.000',
      });

      // go to pipelines listing
      await overview.clickLsPipelines();
      expect(await pipelinesList.isOnListing()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('Logstash Cluster Summary Status shows correct info', async () => {
      expect(await lsClusterSummaryStatus.getContent()).to.eql({
        nodeCount: '2',
        memoryUsed: '528.4 MB / 1.9 GB',
        eventsInTotal: '117.9k',
        eventsOutTotal: '111.9k'
      });
    });

    it('Pipelines table shows correct rows with default sorting', async () => {
      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(4);

      const pipelinesAll = await pipelinesList.getPipelinesAll();

      const tableData = [
        { id: 'main', eventsEmittedRate: '108.3 e/s', nodeCount: '1' },
        { id: 'nginx_logs', eventsEmittedRate: '29.2 e/s', nodeCount: '1' },
        { id: 'test_interpolation', eventsEmittedRate: '0 e/s', nodeCount: '1' },
        { id: 'tweets_about_labradoodles', eventsEmittedRate: '0.6 e/s', nodeCount: '1' },
      ];

      // check the all data in the table
      pipelinesAll.forEach((obj, index) => {
        expect(pipelinesAll[index].id).to.be(tableData[index].id);
        expect(pipelinesAll[index].eventsEmittedRate).to.be(tableData[index].eventsEmittedRate);
        expect(pipelinesAll[index].nodeCount).to.be(tableData[index].nodeCount);
      });
    });

    it('Pipelines Table shows correct rows after sorting by Events Emitted Rate Asc', async () => {
      await pipelinesList.clickEventsEmittedRateCol();

      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(4);

      const pipelinesAll = await pipelinesList.getPipelinesAll();

      const tableData = [
        { id: 'test_interpolation', eventsEmittedRate: '0 e/s', nodeCount: '1' },
        { id: 'tweets_about_labradoodles', eventsEmittedRate: '0.6 e/s', nodeCount: '1' },
        { id: 'nginx_logs', eventsEmittedRate: '29.2 e/s', nodeCount: '1' },
        { id: 'main', eventsEmittedRate: '108.3 e/s', nodeCount: '1' },
      ];

      // check the all data in the table
      pipelinesAll.forEach((obj, index) => {
        expect(pipelinesAll[index].id).to.be(tableData[index].id);
        expect(pipelinesAll[index].eventsEmittedRate).to.be(tableData[index].eventsEmittedRate);
        expect(pipelinesAll[index].nodeCount).to.be(tableData[index].nodeCount);
      });
    });

    it('filters for specific pipelines', async () => {
      await pipelinesList.setFilter('la');
      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(2);
      await pipelinesList.clearFilter();
    });

    it('filters for non-existent pipeline', async () => {
      await pipelinesList.setFilter('foobar');
      await pipelinesList.assertNoData();
      await pipelinesList.clearFilter();
    });
  });
}
