/** getStaticPaths shared by the English and Serbian routes. */
import { getCategories, getProducts, getProductCollections } from './catalog';

export async function categoryPaths() {
  return (await getCategories()).map((category) => ({ params: { category: category.id }, props: { category } }));
}

export async function productPaths() {
  return (await getProducts()).map((product) => ({ params: { slug: product.id }, props: { product } }));
}

export async function collectionPaths() {
  return (await getProductCollections()).map((collection) => ({
    params: { slug: collection.id },
    props: { collection },
  }));
}
