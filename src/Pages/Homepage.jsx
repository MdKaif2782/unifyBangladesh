"use client"

import { useEffect, useState } from "react"
import HeroSlideshow from "../Components/HeroSlideshow"
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import { toast } from "react-toastify"
import { reloadCartLocal } from "../Components/Header"
import { Link, useSearchParams } from "react-router-dom"

const Homepage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState({})
  const [categoryFilter, setCategoryFilter] = useState(null)

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(db, "products")
        const snapshot = await getDocs(productsCollection)
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const categoryFilterParam = searchParams.get("category")
        const productQuery = searchParams.get("product")

        let filteredProducts = productsData

        // Filter by product search query
        if (productQuery) {
          const decodedQuery = decodeURIComponent(productQuery).toLowerCase()
          filteredProducts = productsData.filter(
            (product) =>
              product.productName.toLowerCase().includes(decodedQuery) ||
              product.description.toLowerCase().includes(decodedQuery),
          )
        }
        // Filter by category
        else if (categoryFilterParam) {
          filteredProducts = productsData.filter((product) =>
            product.categories.some((cat) => cat.toLowerCase() === categoryFilterParam.toLowerCase()),
          )
        }

        // Group products by category
        const groupedCategories = filteredProducts.reduce((acc, product) => {
          if (categoryFilterParam) {
            // When filtering by category, only show that specific category
            const matchingCategory = product.categories.find(
              (cat) => cat.toLowerCase() === categoryFilterParam.toLowerCase(),
            )
            if (matchingCategory && !acc[matchingCategory]) {
              acc[matchingCategory] = []
            }
            if (matchingCategory) {
              acc[matchingCategory].push(product)
            }
          } else if (productQuery) {
            // When searching products, group them under "Search Results"
            if (!acc["Search Results"]) {
              acc["Search Results"] = []
            }
            acc["Search Results"].push(product)
          } else {
            // When not filtering, show all categories
            product.categories.forEach((category) => {
              if (!acc[category]) {
                acc[category] = []
              }
              acc[category].push(product)
            })
          }
          return acc
        }, {})

        setProducts(filteredProducts)
        setCategories(groupedCategories)
        setCategoryFilter(categoryFilterParam)
        console.log("Products grouped by category:", groupedCategories)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchParams])

  const handleAddToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || []
    const existingProductIndex = existingCart.findIndex((item) => item.id === product.id)

    if (existingProductIndex !== -1) {
      // Product exists, update quantity
      existingCart[existingProductIndex].quantity += 1
    } else {
      // Add new product with quantity 1
      existingCart.push({ ...product, quantity: 1 })
    }

    localStorage.setItem("cart", JSON.stringify(existingCart))
    toast.success("Product added to cart!")
    reloadCartLocal()
  }

  const sortedCategories = Object.keys(categories).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {!categoryFilter && !searchParams.get("product") && <HeroSlideshow />}
      {(categoryFilter || searchParams.get("product")) && (
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            {categoryFilter ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Products
                </h1>
                <div className="w-20 h-1 bg-orange-400 mx-auto mb-4"></div>
                <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  ← View All Products
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Search Results for "{decodeURIComponent(searchParams.get("product"))}"
                </h1>
                <div className="w-20 h-1 bg-orange-400 mx-auto mb-4"></div>
                <p className="text-gray-600 mb-4">
                  Found {products.length} product{products.length !== 1 ? "s" : ""} matching your search
                </p>
                <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  ← Back to Homepage
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-3"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No products found</h2>
            <p className="text-gray-600">Check back later for new arrivals!</p>
          </div>
        ) : (
          sortedCategories.map((category) => (
            <section key={category} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{category}</h2>
                  <div className="w-12 h-0.5 bg-orange-400"></div>
                </div>
                {!searchParams.get("product") && (
                  <Link
                    to={`?category=${encodeURIComponent(category.toLowerCase())}`}
                    className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
                  >
                    View All →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories[category].map((product) => {
                  const discountPercentage = product.regularPrice
                    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
                    : 0

                  return (
                    <div key={product.id} className="group">
                      <Link to={`/product/${encodeURIComponent(product.id)}`} className="block">
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                          {/* Image Container */}
                          <div className="relative overflow-hidden">
                            <img
                              src={product.photoUrl || "/placeholder.svg"}
                              alt={product.productName}
                              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Discount Badge */}
                            {discountPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                -{discountPercentage}%
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-base mb-2 text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
                              {product.productName}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                            <div className="flex justify-between">
                              <div className="flex justify-start flex-col">
                                <span className="text-md font-bold text-orange-500">BDT {product.price}</span>
                                {product.regularPrice && (
                                  <span className=" text-gray-400 line-through text-sm">
                                    BDT {product.regularPrice}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleAddToCart(product)
                                }}
                                className="w-36 bg-orange-400 hover:bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

export default Homepage
