"use client"

import { useEffect, useState } from "react"
import HeroSlideshow from "../Components/HeroSlideshow"
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import { toast } from "react-toastify"
import { reloadCartLocal } from "../Components/Header"
import { Link, useSearchParams } from "react-router-dom"
import {
  TrendingUp,
  Star,
  Heart,
  ShoppingCart,
  ChevronRight,
  Sparkles,
  Crown,
  Gift,
  ArrowRight,
  Grid3X3,
} from "lucide-react"

const categoriesData = [
  { name: "Cream & Moisturizers", icon: "🧴", color: "from-blue-400 to-blue-600" },
  { name: "Essence", icon: "✨", color: "from-purple-400 to-purple-600" },
  { name: "Eye Care", icon: "👁️", color: "from-green-400 to-green-600" },
  { name: "Face Mask", icon: "🎭", color: "from-pink-400 to-pink-600" },
  { name: "Face Primer", icon: "💄", color: "from-orange-400 to-orange-600" },
  { name: "Facewash & Cleanser", icon: "🧼", color: "from-teal-400 to-teal-600" },
  { name: "Fragrance", icon: "🌸", color: "from-rose-400 to-rose-600" },
  { name: "Hair Care", icon: "💇", color: "from-indigo-400 to-indigo-600" },
  { name: "Lip Care", icon: "💋", color: "from-red-400 to-red-600" },
  { name: "Lotion", icon: "🧴", color: "from-cyan-400 to-cyan-600" },
  { name: "Makeup", icon: "💅", color: "from-violet-400 to-violet-600" },
  { name: "Makeup Remover", icon: "🧽", color: "from-gray-400 to-gray-600" },
  { name: "Non Pharma", icon: "🌿", color: "from-emerald-400 to-emerald-600" },
  { name: "Serum", icon: "💧", color: "from-blue-400 to-cyan-600" },
  { name: "Sunscreen", icon: "☀️", color: "from-yellow-400 to-orange-600" },
  { name: "Toner", icon: "🌊", color: "from-sky-400 to-blue-600" },
  { name: "Tools & Accessories", icon: "🔧", color: "from-slate-400 to-slate-600" },
]

const Homepage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState(categoriesData)
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [trendingProducts, setTrendingProducts] = useState([])
  const [bestSellingProducts, setBestSellingProducts] = useState([])
  const [specialProducts, setSpecialProducts] = useState([])

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

        // Set special sections for homepage
        if (!categoryFilterParam && !productQuery) {
          // Shuffle and select products for different sections
          const shuffled = [...productsData].sort(() => 0.5 - Math.random())
          setTrendingProducts(shuffled.slice(0, 8))
          setBestSellingProducts(shuffled.slice(0, 8))
          setSpecialProducts(shuffled.slice(0, 4))
        }

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

  const ProductCard = ({ product, index = 0 }) => {
    const [isWishlisted, setIsWishlisted] = useState(false)
    const discountPercentage = product.regularPrice
      ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
      : 0

    return (
      <div className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200 flex flex-col">
        <Link to={`/product/${product.id}`} className="block flex-1">
          {/* Image Container - Much smaller for mobile */}
          <div className="relative overflow-hidden h-32 md:h-48">
            <img
              src={product.photoUrl || "/placeholder.svg"}
              alt={product.productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {discountPercentage > 0 && (
                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                  -{discountPercentage}%
                </span>
              )}
            </div>

            {/* Quick Actions - Smaller for mobile */}
            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsWishlisted(!isWishlisted)
                }}
                className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50"
              >
                <Heart
                  className={`w-3 h-3 md:w-4 md:h-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                />
              </button>
            </div>
          </div>

          {/* Content - Much more compact */}
          <div className="p-2 flex-1 flex flex-col">
            <h3 className="font-medium text-xs md:text-sm mb-1 text-gray-900 line-clamp-2 group-hover:text-orange-500 transition-colors leading-tight">
              {product.productName}
            </h3>

            {/* Rating - Smaller */}
            <div className="flex items-center gap-1 mb-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 hidden md:inline">(4.0)</span>
            </div>

            {/* Price - Smaller */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-orange-500">৳{product.price}</span>
                {product.regularPrice && (
                  <span className="text-xs text-gray-400 line-through">৳{product.regularPrice}</span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Add to Cart Button - Bottom of card with seamless border */}
        <div className="p-0">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleAddToCart(product)
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 md:py-3 px-2 rounded-b-lg text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    )
  }

  const CategoryCard = ({ category, index }) => (
    <Link to={`/?category=${encodeURIComponent(category.name)}`} className="group block">
      <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-orange-200 text-center">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
        >
          <span className="text-xl">{category.icon}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-orange-500 transition-colors leading-tight">
          {category.name}
        </h3>
      </div>
    </Link>
  )

  const sortedCategories = Object.keys(categories).sort()

  // If filtering by category or search, show filtered results
  if (categoryFilter || searchParams.get("product")) {
    return (
      <div className="min-h-screen bg-gray-50">
        {(categoryFilter || searchParams.get("product")) && (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              {categoryFilter ? (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Products
                  </h1>
                  <div className="w-20 h-1 bg-orange-400 mx-auto mb-4"></div>
                  <Link to="/" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                    ← View All Products
                  </Link>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
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

        <div className="container mx-auto px-4 py-8">
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
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{category}</h2>
                    <div className="w-12 h-0.5 bg-orange-400"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                  {categories[category].map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    )
  }

  // Homepage layout
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSlideshow />

      {/* Brand Header */}
      {/* <section className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">Unify Bangladesh</h1>
          <p className="text-lg md:text-xl text-orange-100 max-w-2xl mx-auto">
            Your trusted destination for premium beauty and wellness products
          </p>
        </div>
      </section> */}



      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-600">Discover products tailored to your needs</p>
            </div>
            <Grid3X3 className="w-8 h-8 text-orange-500" />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3 md:gap-4">
            {Object.values(categoriesData)
              .slice(0, showAllCategories ? Object.values(categoriesData).length : 9)
              .map((category, index) => (
                <CategoryCard key={category.name} category={category} index={index} />
              ))}
          </div>

          {!showAllCategories && Object.values(categoriesData).length > 9 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCategories(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                See More Categories
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-3"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Trending Products */}
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">Trending Now</h2>
                    <p className="text-gray-600">Most popular products this week</p>
                  </div>
                </div>
                <Link
                  to="/trending"
                  className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {trendingProducts.map((product, index) => (
                  <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Special For You */}
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">Special For You</h2>
                    <p className="text-gray-600">Handpicked products just for you</p>
                  </div>
                </div>
                <Link
                  to="/special"
                  className="text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {specialProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* Best Selling */}
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">Best Selling</h2>
                    <p className="text-gray-600">Customer favorites and top-rated products</p>
                  </div>
                </div>
                <Link
                  to="/bestselling"
                  className="text-green-500 hover:text-green-600 font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {bestSellingProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* Brand Partners Section */}
          <section className="py-8 bg-white border-b border-gray-100 overflow-hidden">
            <div className="container mx-auto px-4">
              <div className="text-center mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Our Brand Partners</h2>
                <p className="text-gray-600 text-sm">Trusted by leading beauty brands worldwide</p>
              </div>

              {/* Sliding Brands Container */}
              <div className="relative">
                <div className="flex animate-slide-brands">
                  {/* First set of brands */}
                  <div className="flex items-center justify-center min-w-0 shrink-0">
                    {[
                      { name: "L'Oréal", logo: "/loreal.png" },
                      { name: "Maybelline", logo: "/maybelline.png" },
                      { name: "Neutrogena", logo: "/neutrogena.png" },
                      { name: "Olay", logo: "/olay.png" },
                      { name: "MAC", logo: "/mac.png" },
                      { name: "NARS", logo: "/nars.png" }
                    ].map((brand, index) => (
                      <div
                        key={`first-${index}`}
                        className="mx-6 md:mx-8 flex items-center justify-center h-16 w-24 md:w-32 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-sm transition-all duration-300 group"
                      >
                        <img
                          src={brand.logo || "/placeholder.svg"}
                          alt={brand.name}
                          className="max-h-10 max-w-full object-contain bg-white filter grayscale group-hover:grayscale-0 transition-all duration-300"
                        />

                      </div>
                    ))}
                  </div>

                  {/* Duplicate set for seamless loop */}
                  <div className="flex items-center justify-center min-w-0 shrink-0">
                    {[
                      { name: "L'Oréal", logo: "/loreal.png" },
                      { name: "Maybelline", logo: "/maybelline.png" },
                      { name: "Neutrogena", logo: "/neutrogena.png" },
                      { name: "Olay", logo: "/olay.png" },
                      { name: "MAC", logo: "/mac.png" },
                      { name: "NARS", logo: "/nars.png" },
                    ].map((brand, index) => (
                      <div
                        key={`second-${index}`}
                        className="mx-6 md:mx-8 flex items-center justify-center h-16 w-24 md:w-32 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-200 hover:shadow-sm transition-all duration-300 group"
                      >
                        <img
                          src={brand.logo || "/placeholder.svg"}
                          alt={brand.name}
                          className="max-h-10 max-w-full object-contain bg-white filter grayscale group-hover:grayscale-0 transition-all duration-300"
                        />

                      </div>
                    ))}
                  </div>
                </div>

                {/* Gradient overlays for smooth edges */}
                <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
                <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
              </div>
            </div>
          </section>
          {/* Newsletter Section */}
          <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-2xl mx-auto">
                <Gift className="w-16 h-16 text-white mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Stay Updated with Latest Offers</h2>
                <p className="text-orange-100 mb-8">
                  Subscribe to our newsletter and get exclusive deals, new product launches, and beauty tips.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:outline-none"
                  />
                  <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .animate-slide-brands {
          animation: slideBrands 30s linear infinite;
        }
        @keyframes slideBrands {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-slide-brands:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export default Homepage
