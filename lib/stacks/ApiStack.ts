import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as path from 'path';
import { API_MAIN_GO_CMD, GO_BUILD_COMMAND, PATH_TO_ROOT, SYNC_MAIN_GO_CMD } from '../constants/StackConstants';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // --- API Gateway Lambda ---
    const apiFn = new lambda.Function(this, 'GoApiHandler', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, PATH_TO_ROOT), {
        bundling: {
          image: cdk.DockerImage.fromRegistry('golang:1.26-alpine'),
          command: [...GO_BUILD_COMMAND, API_MAIN_GO_CMD],
        },
      }),
    });

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'my-api',
    });
    const transactions = api.root.addResource('transactions');
    transactions.addMethod('GET', new apigateway.LambdaIntegration(apiFn));

    // --- EventBridge Lambda ---
    const syncFn = new lambda.Function(this, 'GoSyncHandler', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, PATH_TO_ROOT), {
        bundling: {
          image: cdk.DockerImage.fromRegistry('golang:1.26-alpine'),
          command: [...GO_BUILD_COMMAND, SYNC_MAIN_GO_CMD],
        },
      }),
    });

    // run every night at midnight
    const rule = new events.Rule(this, 'SyncRule', {
      schedule: events.Schedule.cron({ hour: '0', minute: '0' }),
    });
    rule.addTarget(new targets.LambdaFunction(syncFn));

    props.table.grantReadWriteData(apiFn);
    props.table.grantReadWriteData(syncFn);
  }
}