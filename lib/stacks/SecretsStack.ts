import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class SecretsStack extends cdk.Stack {
  public readonly plaidClientSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.plaidClientSecret = new secretsmanager.Secret(this, 'PlaidClientSecret', {
      secretName: 'budget-tracker/plaid-client-secret',
      description: 'Plaid client secret used by the budget tracker API and sync Lambdas',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'placeholder',
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'PlaidClientSecretArn', {
      value: this.plaidClientSecret.secretArn,
    });
  }
}
