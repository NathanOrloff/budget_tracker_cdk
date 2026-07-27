#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { DatabaseStack } from '../lib/stacks/DatabaseStack';
import { CognitoStack } from '../lib/stacks/CognitoStack';
import { SecretsStack } from '../lib/stacks/SecretsStack';
import { ApiStack } from '../lib/stacks/ApiStack';

const app = new cdk.App();

const dbStack = new DatabaseStack(app, 'DatabaseStack');

const secretsStack = new SecretsStack(app, 'SecretsStack');
const cognitoStack = new CognitoStack(app, 'CognitoStack');
const apiStack = new ApiStack(app, 'ApiStack', {
  table: dbStack.table,
  userPool: cognitoStack.userPool,
  plaidClientSecret: secretsStack.plaidClientSecret,
});
