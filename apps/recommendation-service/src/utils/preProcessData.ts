import { Product } from "@e-com/db";

export function preProcessData(userActions: any, products: Product) {
  const interactions: any = [];

  userActions.forEach((action: any) => {
    interactions.push({
      userId: action.userId,
      productId: action.productId,
      actionType: action.actionType,
    });
  });

  return { interactions, products };
}
