// tslint:disable:no-bitwise

import * as ts from "typescript";
import * as Lint from "tslint";

interface Options {
  tc: ts.TypeChecker;
}

export class Rule extends Lint.Rules.TypedRule {
  // tslint:disable object-literal-sort-keys
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "react-disallow-nil-in-value-props",
    description:
      "Warn the developer if they accidentally pass undefined/null to a component's `value` property",
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: ["true"],
    type: "functionality",
    typescriptOnly: false,
    hasFix: false,
    requiresTypeInfo: true
  };
  // tslint:enable object-literal-sort-keys

  public static FAILURE_STRING = `React components should never be able to have undefined/null passed into a value prop or the component will become uncontrolled.`;

  public applyWithProgram(
    sourceFile: ts.SourceFile,
    program: ts.Program
  ): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk, {
      tc: program.getTypeChecker()
    });
  }
}

function walk(ctx: Lint.WalkContext<Options>) {
  const checker = ctx.options.tc;
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (
      ts.isJsxAttribute(node) && // Check to make sure that node is a prop of a JSX component
      node.name.text === "value" && // Check that prop's name is "value"
      node.initializer && // Check that initializer exists
      ts.isJsxExpression(node.initializer) // Check that prop's initializer is an expression and not a string literal
    ) {
      const expression = node.initializer.expression as ts.JsxExpression;
      const type = checker.getTypeAtLocation(expression);
      const flagValue = type.flags;

      const flagsToLookFor = ts.TypeFlags.Undefined | ts.TypeFlags.Null;

      // If the type's flag is a union, iterate through the union's individual types
      if (flagValue === ts.TypeFlags.Union) {
        const { types } = type as ts.UnionOrIntersectionType;
        types.forEach(({ flags }) => {
          addFailuresForMatchingFlags(ctx, expression, flags, flagsToLookFor);
        });
      } else {
        addFailuresForMatchingFlags(ctx, expression, flagValue, flagsToLookFor);
      }
    }

    return ts.forEachChild(node, cb);
  });
}

function addFailuresForMatchingFlags(
  ctx: Lint.WalkContext<Options>,
  currentNode: ts.Node,
  flag: ts.TypeFlags,
  flagsToLookFor: number | ts.TypeFlags
) {
  if (flag & flagsToLookFor) {
    // In this block, we know that the type, at least, has the possibility of being undefined or null
    ctx.addFailure(
      currentNode.getStart(),
      currentNode.getEnd(),
      Rule.FAILURE_STRING
    );
  }
}
