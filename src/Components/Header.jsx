"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Menu, X, Plus, Minus, MapPin, User, LogOut, Heart, ChevronDown } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { db, auth } from "../firebase"
import { signOut } from "firebase/auth"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import Modal from "react-modal"
import { toast } from "react-toastify"

// Modal setup
Modal.setAppElement("#root")
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "500px",
    width: "90%",
    border: "none",
    borderRadius: "16px",
    padding: "0",
    overflow: "hidden",
    zIndex: 9999,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
  },
}

const categories = [
  "Cream & Moisturizers",
  "Essence",
  "Eye Care",
  "Face Mask",
  "Face Primer",
  "Facewash & Cleanser",
  "Fragrance",
  "Hair Care",
  "Lip Care",
  "Lotion",
  "Makeup",
  "Makeup Remover",
  "Non Pharma",
  "Serum",
  "Sunscreen",
  "Toner",
  "Tools & Accessories",
]

let reloadCartLocal
export { reloadCartLocal }

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart")
      return savedCart ? JSON.parse(savedCart) : []
    }
    return []
  })
  const [deliveryLocation, setDeliveryLocation] = useState("inside")
  const [showCheckout, setShowCheckout] = useState(false)
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery.trim())
      navigate(`/?product=${encodedQuery}`)
      setIsSearchActive(false) // Close mobile search
    }
  }

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive)
    if (isSearchActive) {
      setSearchQuery("")
    }
  }

  useEffect(() => {
    if (cartOpen) {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) setCartItems(JSON.parse(savedCart))
    }
  }, [cartOpen])

  const updateQuantity = (id, newQuantity) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems
        .map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
        .filter((item) => item.quantity > 0)
      localStorage.setItem("cart", JSON.stringify(updatedItems))
      return updatedItems
    })
  }

  const removeItem = (id) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id)
      localStorage.setItem("cart", JSON.stringify(updatedItems))
      return updatedItems
    })
  }

  reloadCartLocal = () => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) setCartItems(JSON.parse(savedCart))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryCharge = deliveryLocation === "inside" ? 70 : 120
  const total = subtotal + deliveryCharge
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid))
        if (userDoc.exists()) {
          setUserDetails({
            name: userDoc.data().name || "",
            email: userDoc.data().email || "",
            phone: userDoc.data().mobile || "",
            address: userDoc.data().address || "",
          })
        }
      }
      setLoadingUser(false)
    })
    return () => unsubscribe()
  }, [])

  const handleCheckout = async () => {
    setShowCheckout(true)
    setCartOpen(false)
  }

  const submitOrder = async (e) => {
    e.preventDefault()
    try {
      const orderData = {
        user: currentUser
          ? {
              uid: currentUser.uid,
              ...userDetails,
            }
          : userDetails,
        items: cartItems,
        subtotal,
        deliveryCharge,
        total,
        deliveryLocation,
        status: "pending",
        createdAt: new Date(),
      }

      const docRef = await addDoc(collection(db, "orders"), orderData)
      console.log("Order submitted with ID: ", docRef.id)

      localStorage.removeItem("cart")
      setCartItems([])
      setCartOpen(false)
      setShowCheckout(false)
      toast.success("Order placed successfully!")
    } catch (error) {
      console.error("Error submitting order: ", error)
      toast.error("Error placing order. Please try again.")
    }
  }

  const onLogout = async () => {
    try {
      await signOut(auth)
      setUserMenuOpen(false)
      toast.success("Logged out successfully!")
    } catch (error) {
      console.error("Error logging out: ", error)
      toast.error("Error logging out. Please try again.")
    }
  }

  const CheckoutModal = () => (
    <Modal isOpen={showCheckout} onRequestClose={() => setShowCheckout(false)} style={customStyles}>
      <div className="bg-white">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Complete Your Order</h2>
            <button onClick={() => setShowCheckout(false)} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={submitOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userDetails.name}
                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={userDetails.phone}
                onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <textarea
                required
                value={userDetails.address}
                onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                rows="3"
                placeholder="Enter your complete delivery address"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items):</span>
                  <span>৳{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-500">৳{total}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                {loadingUser ? "Loading..." : "Confirm Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      {/* Mobile Search Mode */}
      {isSearchActive && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <button type="button" onClick={handleSearchToggle} className="text-gray-500">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}

      {/* Main Header */}
      <div
        className={`max-w-7xl mx-auto px-4 py-3 ${isSearchActive ? "hidden md:flex" : "flex"} items-center justify-between`}
      >
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src="/unifylogo.png" alt="SkinPlus Logo" className="h-12 w-auto" />
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 mx-8 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands and categories..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all hover:border-gray-400"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Search Button */}
          <button
            onClick={handleSearchToggle}
            className="md:hidden text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Wishlist */}
          <button className="hidden md:flex text-gray-600 hover:text-orange-500 transition-colors">
            <Heart className="w-6 h-6" />
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Section */}
          {!currentUser ? (
            <Link to="/login" className="hidden md:block">
              <button className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors">
                Sign In
              </button>
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <span className="hidden md:block font-medium">
                  {userDetails.name ? userDetails.name.split(" ")[0] : "User"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-orange-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Categories Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-white hover:bg-orange-600 px-4 py-3 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="font-medium">All Categories</span>
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-8">
              {["Home", "Brands", "Blog"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-white hover:text-orange-100 font-medium py-3 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 w-80 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Sign In Button for Mobile (only show when not logged in) */}
              {!currentUser && (
                <div className="border-b border-gray-200 pb-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-white bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* User Profile Section for Mobile (only show when logged in) */}
              {currentUser && (
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-lg mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{userDetails.name || "User"}</p>
                      <p className="text-sm text-gray-500">{userDetails.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        onLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-2">
                {["Home", "Brands", "Blog"].map((item) => (
                  <Link
                    key={item}
                    to={`/${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              {/* Categories */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      to={`?category=${encodeURIComponent(cat)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute left-0 top-0 w-80 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50">
              <h2 className="text-lg font-semibold text-gray-900">All Categories</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-full">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    to={`?category=${encodeURIComponent(cat)}`}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors border border-gray-200 hover:border-orange-200"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>{cat}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="absolute right-0 top-0 w-96 h-full bg-white shadow-xl flex flex-col">
            {/* Cart Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Shopping Cart ({totalItems})</h2>
                <button onClick={() => setCartOpen(false)} className="text-white hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-700">Delivery Location</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeliveryLocation("inside")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    deliveryLocation === "inside"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  Inside Dhaka (৳70)
                </button>
                <button
                  onClick={() => setDeliveryLocation("outside")}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    deliveryLocation === "outside"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  Outside Dhaka (৳120)
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-gray-400 text-sm">Add some products to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={item.photoUrl || "/placeholder.svg"}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{item.productName}</h4>
                          <p className="text-sm text-gray-500 mb-2">Size: {item.size}</p>
                          <p className="font-semibold text-orange-500">৳{item.price}</p>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery:</span>
                    <span>৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-3">
                    <span>Total:</span>
                    <span className="text-orange-500">৳{total}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>}

      <CheckoutModal />
    </header>
  )
}

export default Header
