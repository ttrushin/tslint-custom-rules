import * as ts from "typescript";
import * as Lint from "tslint";
import { sortBy } from "lodash";

interface MappedMember {
  fullString: string;
  propertyName: string;
  sortOrder: number;
}

export class Rule extends Lint.Rules.AbstractRule {
  // tslint:disable object-literal-sort-keys
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "sort-interfaces",
    description:
      "Make sure that TypeScript interfaces are sorted with index signatures first, then standard properties, then functions, with each group sorted alphabetically",
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: ["true"],
    type: "maintainability",
    typescriptOnly: false,
    hasFix: true
  };
  // tslint:enable object-literal-sort-keys

  public static generateFailureString = (interfaceName: string) => {
    return `TypeScript interface "${interfaceName}" must be sorted alphabetically`;
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function walk(ctx: Lint.WalkContext<void>) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (
      ts.isInterfaceDeclaration(node) && // verify that the node is a TypeScript interface declaration
      node.members.length > 1 // verify that we have more than 1 member in the interface
    ) {
      // Map an array of interface members into an easy-to-use format
      const mappedMembers: MappedMember[] = node.members.map(value => {
        const returnObject: MappedMember = {
          fullString: "",
          propertyName: "",
          sortOrder: 1
        };

        if (ts.isPropertySignature(value)) {
          // Sort members with function type at bottom, otherwise in middle
          const isfunctionType =
            value.type !== undefined &&
            value.type.kind === ts.SyntaxKind.FunctionType;

          returnObject.sortOrder = isfunctionType ? 2 : 1;
          returnObject.fullString = value.getFullText();
          returnObject.propertyName = value.name.getText();
        } else if (ts.isMethodSignature(value)) {
          // Sort members with function type at bottom
          returnObject.sortOrder = 2;
          returnObject.fullString = value.getFullText();
          returnObject.propertyName = value.name.getText();
        } else if (value.kind === ts.SyntaxKind.IndexSignature) {
          // Sort index signatures at the top
          returnObject.sortOrder = 0;
          returnObject.fullString = value.getFullText();
          returnObject.propertyName = value.getText();
        }

        return returnObject;
      });

      // Sort members by sort order, then alphabetically
      const sortByPropertyName = (value: MappedMember) => value.propertyName;
      const sortBySortOrder = (value: MappedMember) => value.sortOrder;
      const sortedMembers = sortBy(mappedMembers, [
        sortBySortOrder,
        sortByPropertyName
      ]);

      // Instantiate an empty Replacement array
      const replacementArray: Lint.Replacement[] = [];

      // Determine which members are out of order and push a new Replacement into the Replacement array for each
      node.members.forEach((value, index) => {
        const text =
          value.name !== undefined ? value.name.getText() : value.getText();
        if (sortedMembers[index].propertyName !== text) {
          replacementArray.push(
            Lint.Replacement.replaceFromTo(
              value.getFullStart(),
              value.getEnd(),
              sortedMembers[index].fullString
            )
          );
        }
      });

      // If we have replacements, add the failure to the node so that TSLint can fix the issue automatically for the user
      if (replacementArray.length > 0) {
        ctx.addFailureAtNode(
          node.name,
          Rule.generateFailureString(node.name.getText() || "<unknown>"),
          replacementArray
        );
      }
    }

    // Recursion, since we need to check every single node
    return ts.forEachChild(node, cb);
  });
}
