"use server";

import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { existsSync } from "fs";

export const createNode = async (
  prevState: {
    message: string;
  },
  formData: FormData
) => {
  try {

    const pathToStarterRepoFolder = ""      //git clone https://github.com/n8n-io/n8n-nodes-starter
    const pathToStarterRepoNodesFolder = ""
    const sudoPassword = ""       //if you need sudo access
    const pathToN8NCustomFolder = ""  //usually ~/.n8n/custom/  --- for more info https://docs.n8n.io/integrations/creating-nodes/test/run-node-locally/
    const starterPackageName = ""     //value of name field in package.js of starter repo
    
    const displayName = formData.get("displayName") as string;
    const description = formData.get("description") as string;
    const func = formData.get("func") as string;
    if (!func || !displayName || !description) return;
    const parameters = func
      .split("(")[1]
      .split(")")[0]
      .split(",")
      .map((parameter) => parameter.trim());

    const node = `
        import {
          INodeExecutionData,
          INodeType,
          INodeTypeDescription,
          NodeOperationError,
          IExecuteFunctions,
          IDataObject,
        } from 'n8n-workflow';
        
        export class ${displayName.split(" ").join("")} implements INodeType {
          description: INodeTypeDescription = {
            displayName: "${displayName}",
            name: "${displayName.at(0)?.toLowerCase()}${displayName
      .split(" ")
      .join("")
      .slice(1)}",
            group: ['transform'],
            version: 1,
            description: "${description}",
            defaults: {
              name: "${displayName.at(0)?.toLowerCase()}${displayName
      .split(" ")
      .join("")
      .slice(1)}",
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [${parameters.map(
              (parameter, i) => `
              // Node properties which the user gets displayed and
              // can change on the node.
              {
                displayName: "Parameter ${i + 1}",
                name: "${parameter}",
                type: 'string',
                default: '',
                placeholder: 'Placeholder value',
                description: 'The description text',
              }
            `
            )}],
            }
            async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
              const items = this.getInputData();
          console.log(items)
              const output: Array<IDataObject> = []
              
          
              // Iterates over all input items and add the key "myString" with the
              // value the parameter "myString" resolves to.
              // (This could be a different value for each item in case it contains an expression)
              for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                try {
                    const parameters = [${parameters.map(
                    (parameter) => `this.getNodeParameter('${parameter}', itemIndex, '') as string`
                  )}]
                  console.log(parameters)
                  const func = eval('() => ${func};')
                  console.log(await func())
                  console.log(await func()(...parameters))
                  output.push(await func()(...parameters))
                } catch (error) {
                  // This node should never fail but we want to showcase how
                  // to handle errors.
                  if (this.continueOnFail()) {
                    items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
                    return this.prepareOutputData(items)
                  } else {
                    // Adding itemIndex allows other workflows to handle this error
                    if (error.context) {
                      // If the error thrown already contains the context property,
                      // only append the itemIndex
                      error.context.itemIndex = itemIndex;
                      throw error;
                    }
                    throw new NodeOperationError(this.getNode(), error, {
                      itemIndex,
                    });
                  }
                }
              }
          console.log(output)
            return [this.helpers.returnJsonArray(output)];
            }
        }`;
   
   if(!existsSync(`${pathToStarterRepoNodesFolder}/${displayName
    .split(" ")
    .join("")}`)){ await mkdir(`${pathToStarterRepoNodesFolder}/${displayName
        .split(" ")
        .join("")}`)}
      await writeFile(
        `${pathToStarterRepoNodesFolder}/${displayName
          .split(" ")
          .join("")}/${displayName.split(" ").join("")}.node.ts`,
        node,
        "utf-8",
      );
    

      execSync(`echo '${sudoPassword}' | sudo -S npm run build`, {  //change build script in starter-repo to tsc && gulp build:icons && npm link
        cwd: pathToStarterRepoFolder,
      });
      execSync(`echo '${sudoPassword}' | sudo -S npm link ${starterPackageName} --legacy-peer-deps`, { cwd: pathToN8NCustomFolder });
      
      execSync("pm2 restart n8n"); // need to install pm2 and n8n globally and then pm2 start n8n
    return { message: "done" };
  } catch (error) {
    return { message: `Failed please try again: ${JSON.stringify(error)}` };
  }
};
