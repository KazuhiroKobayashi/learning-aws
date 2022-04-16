#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ASGCWStack } from "../lib/asg-cw/asg-cw-stack";

const app = new cdk.App();
cdk.Tags.of(app).add("Project", "learning-aws");

// ASG-CW
const asgcw = new ASGCWStack(app, "ASGCW", {});
