import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as path from 'path';
import { API_MAIN_GO_CMD, GO_BUILD_COMMAND, PATH_TO_ROOT, PLAID_CLIENT_ID, PLAID_COUNTRY_CODES, PLAID_ENV, PLAID_PRODUCTS, PLAID_REDIRECT_URI, SYNC_MAIN_GO_CMD } from '../constants/StackConstants';

interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  plaidClientSecret: secretsmanager.Secret;
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

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [props.userPool],
    });
    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const transactions = api.root.addResource('transactions');
    transactions.addMethod('GET', new apigateway.LambdaIntegration(apiFn), authOptions);

    const createLinkToken = api.root.addResource('create-link-token');
    createLinkToken.addMethod('GET', new apigateway.LambdaIntegration(apiFn), authOptions);

    const exchangePublicToken = api.root.addResource('exchange-public-token');
    exchangePublicToken.addMethod('POST', new apigateway.LambdaIntegration(apiFn), authOptions);

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

    props.plaidClientSecret.grantRead(apiFn);
    props.plaidClientSecret.grantRead(syncFn);

    apiFn.addEnvironment('PLAID_SECRET', props.plaidClientSecret.secretArn);
    apiFn.addEnvironment('PLAID_ENV', PLAID_ENV);
    apiFn.addEnvironment('PLAID_CLIENT_ID', PLAID_CLIENT_ID);
    apiFn.addEnvironment('PLAID_REDIRECT_URI', PLAID_REDIRECT_URI);
    apiFn.addEnvironment('PLAID_COUNTRY_CODES', PLAID_COUNTRY_CODES);
    apiFn.addEnvironment('PLAID_PRODUCTS', PLAID_PRODUCTS);
    apiFn.addEnvironment('ENV_REGION', this.region);
    apiFn.addEnvironment('PLAID_TABLE_NAME', props.table.tableName);

    syncFn.addEnvironment('PLAID_SECRET', props.plaidClientSecret.secretArn);
    syncFn.addEnvironment('PLAID_ENV', PLAID_ENV);
    syncFn.addEnvironment('PLAID_CLIENT_ID', PLAID_CLIENT_ID);
    syncFn.addEnvironment('PLAID_REDIRECT_URI', PLAID_REDIRECT_URI);
    syncFn.addEnvironment('PLAID_COUNTRY_CODES', PLAID_COUNTRY_CODES);
    syncFn.addEnvironment('PLAID_PRODUCTS', PLAID_PRODUCTS);
    syncFn.addEnvironment('ENV_REGION', this.region);
    syncFn.addEnvironment('PLAID_TABLE_NAME', props.table.tableName);
  }
}