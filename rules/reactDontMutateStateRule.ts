import * as ts from "typescript";
import * as Lint from "tslint";

export class Rule extends Lint.Rules.AbstractRule {
  // tslint:disable object-literal-sort-keys
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "react-dont-mutate-state",
    description: "Forbidden the mutation of state in a component",
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: ["true"],
    type: "functionality",
    typescriptOnly: false
  };
  // tslint:enable object-literal-sort-keys

  public static FAILURE_STRING = "Do not mutate state.";

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function walk(ctx: Lint.WalkContext<void>) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (
      ts.isBinaryExpression(node) && // verify that node is some form of binary expression
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken && // verify that the operator is an equals
      ts.isPropertyAccessExpression(node.left) && // verify that the left-side of the expression involves accessing a property
      node.left.getFirstToken().kind === ts.SyntaxKind.ThisKeyword && // verify that the top-level node is `this`
      node.left.getText().indexOf(".state.") > -1 // verify that we are accessing `this.state.SOMETHING`, specifically
    ) {
      // add the failure at this node
      ctx.addFailureAtNode(node.left, Rule.FAILURE_STRING);
    }

    return ts.forEachChild(node, cb);
  });
}
