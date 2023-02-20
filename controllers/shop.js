const Product = require("../models/product");
const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const PdfDocument = require("pdfkit");
const stripe = require("stripe")("sk_test_51MMoTmSIEjvNDjt8DTYraXNQZgXvPDzqDJftkwU4GvgdZ2eH27g5Mst1VcEenAzmUXoH8RSt3jylalFl6FrvMD7A00I3EvePmj");

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * 2)
        .limit(2);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: 2 * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / 2)
      });
    })
    .catch(err => {
      console.log(err)
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * 2)
        .limit(2);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: 2 * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / 2)
      });
    })
    .catch(err => {
      console.log(err)
    });
};

exports.getCart = (req, res, next) => {
  console.log("entered");
  req.user.populate("cart.items.productId").then((user) => {
    console.log(user.cart.items);
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: products,
      isAuthenticated: req.session.isLoggedIn,
    });
  });
};
exports.getCheckout = (req, res, next) => {
  let products
  let total 
  req.user.populate("cart.items.productId").then((user) => {
    
    products = user.cart.items;
    total = 0
    products.forEach(p => {
      total += p.quantity * p.productId.price
    })
    let transformed = products.map(p=>{
      return {
        // description:p.productId.description,
        quantity:p.quantity,
        price_data:{
          currency:'usd',
          unit_amount:p.productId.price*100,
          product_data:{
            name:p.productId.title,
          }
        }
      }
    })
    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:'payment',
      
      line_items: transformed,
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    });
  }).then(session=>{
    res.render("shop/checkout", {
      path: "/checkout",
      pageTitle: "CheckOut",
      products: products,
      totalSum:total,
      sessionId:session.id
    });
  });
}
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    });
  // Product.findById(prodId, product => {
  //   Cart.addProduct(prodId, product.price);
  // });
  // res.redirect('/cart');
};

exports.postCartDeleteProduct = (req, res, next) => {
  console.log("User");
  const prodId = req.body.productId;
  req.user.removeFromCart(prodId).then((result) => {
    res.redirect("/cart");
  });
};

exports.getOrders = (req, res, next) => {
  res.render("shop/orders", {
    path: "/orders",
    pageTitle: "Your Orders",
    isAuthenticated: req.isLoggedIn,
  });
};
exports.createOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const product = user.cart.items.map((item) => {
        console.log({ product: item.productId, quantity: item.quantity });
        return { product: { ...item.productId._doc }, quantity: item.quantity };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: product,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect("/orders");
    });
};
exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id }).then((orders) => {
    res.render("shop/orders", {
      path: "/orders",
      pageTitle: "Your Orders",
      orders: orders,
      isAuthenticated: req.session.isLoggedIn,
    });
  });
};
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId).then((order) => {
    if (!order) {
      res.redirect("/products");
      return;
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      res.redirect("/products");
      return;
    }
    const invoiceName = "invoice-" + orderId + ".pdf";
    const invoicePath = path.join("data", "invoices", invoiceName);

    const pdfDoc = new PdfDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="' + invoiceName + '"'
    );
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text("Invoice", {
      underline: true,
    });
    pdfDoc.text("-----------------------");
    let totalPrice = 0;
    order.products.forEach((prod) => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc
        .fontSize(14)
        .text(
          prod.product.title +
            " - " +
            prod.quantity +
            " x " +
            "$" +
            prod.product.price
        );
    });
    pdfDoc.text("---");
    pdfDoc.end();
  });
  // fs.readFile(invoicePath, (err, data) => {
  //   if (err) {
  //     console.log(err);
  //     return;
  //   }
  //   res.setHeader("Content-Type", "application/pdf");
  //   res.setHeader(
  //     "Content-Disposition",
  //     'inline; filename="' + invoiceName + '"'
  //   );
  //   res.send(data);
};
