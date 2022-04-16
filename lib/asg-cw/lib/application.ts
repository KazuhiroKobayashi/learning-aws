import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as cw from "aws-cdk-lib/aws-cloudwatch";

import { Settings, Constant } from "../settings";
import {
  ApplicationProps,
  SGList,
  TGList,
  RoleList,
  ASGList,
} from "./interfaces";

export class Application extends Construct {
  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id);

    // Target Groups
    const tgList = this.createTGs(props.vpc);

    // Application Load Balancers
    this.createALBs(props.vpc, props.sgList, tgList);

    // AutoScaling Groups
    const asgList = this.createASGs(
      props.vpc,
      props.sgList,
      props.roleList,
      tgList
    );

    // Alarms
    this.createCWAlarms(asgList);
  }

  // Create Target Groups
  createTGs = (vpc: ec2.Vpc): TGList => {
    const tgCommonProps: elb.ApplicationTargetGroupProps = {
      healthCheck: {
        enabled: true,
        healthyHttpCodes: "200",
        healthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        port: Constant.PORT.HTTP.toString(),
        protocol: elb.Protocol.HTTP,
        unhealthyThresholdCount: 2,
      },
      port: Constant.PORT.HTTP,
      protocol: elb.ApplicationProtocol.HTTP,
      targetType: elb.TargetType.INSTANCE,
      vpc: vpc,
    };
    // Web
    const tgWebName = `${Settings.Prefix}-tg-web`;
    const tgWeb = new elb.ApplicationTargetGroup(this, "TGWeb", {
      ...{ targetGroupName: tgWebName },
      ...tgCommonProps,
    });
    cdk.Tags.of(tgWeb).add("Name", tgWebName);

    return {
      web: tgWeb,
    };
  };

  // Create Application Load Balancers
  createALBs = (vpc: ec2.Vpc, sgList: SGList, tgList: TGList) => {
    const albName = `${Settings.Prefix}-alb`;
    const alb = new elb.ApplicationLoadBalancer(this, "ALB", {
      loadBalancerName: albName,
      vpc: vpc,
      internetFacing: true,
      securityGroup: sgList.alb,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    alb.addListener("ALBListener", {
      defaultAction: elb.ListenerAction.forward([tgList.web]),
      port: Constant.PORT.HTTP,
      protocol: elb.ApplicationProtocol.HTTP,
    });
    cdk.Tags.of(alb).add("Name", albName);
  };

  // Create AutoScaling Groups
  createASGs = (
    vpc: ec2.Vpc,
    sgList: SGList,
    roleList: RoleList,
    tgList: TGList
  ): ASGList => {
    // Web
    const asgWebName = `${Settings.Prefix}-asg-web`;
    const asgWeb = new autoscaling.AutoScalingGroup(this, "ASGWeb", {
      autoScalingGroupName: asgWebName,
      instanceType: Settings.Web.InstanceType,
      machineImage: Settings.Web.MachineImage,
      vpc: vpc,
      associatePublicIpAddress: true,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(1),
      }),
      instanceMonitoring: autoscaling.Monitoring.BASIC,
      maxCapacity: 1,
      minCapacity: 1,
      role: roleList.web,
      securityGroup: sgList.web,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    // Attach to Target Group
    asgWeb.attachToApplicationTargetGroup(tgList.web);
    cdk.Tags.of(asgWeb).add("Name", asgWebName);

    return {
      web: asgWeb,
    };
  };

  // Create Cloudwatch Alarms
  createCWAlarms = (asgList: ASGList) => {
    // CPU
    const alarmCPUName = `${Settings.Prefix}-cwalarm-cpu`;
    const alarmCPU = new cw.Alarm(this, "CWAlarmCPU", {
      alarmName: alarmCPUName,
      evaluationPeriods: 3,
      metric: new cw.Metric({
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: cdk.Duration.minutes(1),
        statistic: cw.Statistic.AVERAGE,
        dimensionsMap: {
          AutoScalingGroupName: asgList.web.autoScalingGroupName,
        },
      }),
      threshold: 80,
      actionsEnabled: true,
      comparisonOperator:
        cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      datapointsToAlarm: 3,
      treatMissingData: cw.TreatMissingData.BREACHING,
    });
  };
}
