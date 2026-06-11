#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ApiStack } from '../lib/stacks/ApiStack';
import { DatabaseStack } from '../lib/stacks/DatabaseStack';

const app = new cdk.App();

const dbStack = new DatabaseStack(app, 'DatabaseStack');

new ApiStack(app, 'ApiStack', {
  table: dbStack.table,
});
