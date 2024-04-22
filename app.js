require('dotenv').config()
const express = require('express') 
const ejs = require('ejs')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const session = require('express-session')
const adminkey = process.env.ADMINKEY
const secretkey = process.env.SECRETKEY

const adminSchema = require('./schema/adminSchema')
const userSchema = require('./schema/userSchema')
const profileSchema = require('./schema/profileSchema')

const mongodb = process.env.MONGODB
mongoose.connect(mongodb)
.then(() => {
   console.log('Connection successful')
}).catch((err) => {
    console.log(err, "Connection failed")
})

const app = express()
app.use('/assets', express.static('assets')) 
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.json())
app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: 'secret',
    })
);

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.get('/register', function(req,res){ 
    res.render('register')
})

app.post('/register', function(req,res){ 
    const details = req.body
    const username = details.username
    const password = details.password

    registerUser()

    async function registerUser(){
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        try{
            const user = new userSchema({
                username: username,
                password: hashedPassword
            })
            await user.save()
            res.redirect('/access')
        }catch(err){
            console.log(err)
        }
    }
})


app.get('/', function(req,res){ 
    res.render('user-login')
})

app.post('/admin-login', (req,res)=>{
    const loginInfo = req.body

    const username = loginInfo.username
    const password = loginInfo.password

    adminSchema.findOne({username})
    .then((admin)=>{
        adminSchema.findOne({username: username}, (err,details)=>{
            if(!details){
                req.flash('danger','User not found!')
                res.redirect('/admin')
            } else{
                bcrypt.compare(password, admin.password, async (err,data)=>{
                    if(data){
                        const payload1 = {
                            user:{
                                username: admin.username
                            }
                        }
                        const token1 = jwt.sign(payload1, adminkey,{
                            expiresIn: '3600s'
                        })

                        res.cookie('admintoken', token1, {
                            httpOnly: false
                        })

                        res.redirect('/admin/manage')
                    } else{
                        req.flash('danger', 'Incorrect Password!')
                        res.redirect('/admin')
                    }
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
    })
})
app.post('/user-login', (req,res)=>{
    const loginInfo = req.body

    const username = loginInfo.username
    const password = loginInfo.password

  userSchema.findOne({username})
  .then((user)=>{
      userSchema.findOne({username: username}, (err, details)=>{
          if (!details){
              req.flash('danger', 'User Does Not Exist!')
              res.redirect('/')
          } else {
              bcrypt.compare(password, user.password, async (err,data)=>{
                  if (data){
                      const payload = {
                          user: {
                              username: user.username
                          }
                      }
                      const token = jwt.sign(payload, secretkey,{
                          expiresIn: '7200s'
                      })
  
                      res.cookie('logintoken', token, {
                          httpOnly: false
                      })
  
                      res.redirect('/access')
                      // console.log('Login Sucessful')
                      // req.flash('success', 'Login Up Successful')
                      // res.redirect('/login')
                  } else {
                      req.flash('danger', 'Incorrect Password!')
                      res.redirect('/')
                  }
              })
          }
      } )
  }).catch((err)=>{
      console.log(err)
  })
})

app.get('/admin', function(req,res){ 
    res.render('admin-login')
})

function protectAdminRoute(req, res, next){
    const token = req.cookies.admintoken
    try{
        const user = jwt.verify(token, adminkey)

        req.user = user
        // console.log(req.user)
        next()
    }
    catch(err){
        res.clearCookie('admintoken')
        return res.redirect('/admin')
    }
}

app.get('/admin/manage',protectAdminRoute, async function(req,res){ 
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    const profiles = await profileSchema.find()
    res.render('admin-manage', {theuser: theuser, profiles: profiles})
})

app.get('/admin/logs',protectAdminRoute, async function(req,res){ 
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('admin-logs', {theuser: theuser})
})

app.get('/admin/users',protectAdminRoute, async function(req,res){ 
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    const admins = await adminSchema.find()
    const users = await userSchema.find()
    res.render('admin-users', {theuser: theuser, admins: admins, users: users})
})

app.get('/admin/users/new-admin', protectAdminRoute, async (req,res)=>{
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('new-admin', {theuser: theuser})
})

app.get('/admin/manage/new-profile', protectAdminRoute, async (req,res)=>{
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('new-profile', {theuser: theuser})
})

app.get('/admin/users/new-user', protectAdminRoute, async (req,res)=>{
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('new-user', {theuser: theuser})
})

app.post('/new-admin', (req,res)=>{

    const details = req.body
    const firstname = details.firstname
    const lastname = details.lastname
    const username = details.username
    const password = details.password

    registerUser()

    async function registerUser(){
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        try{
            const admin = new adminSchema({
                firstname: firstname,
                lastname: lastname,
                username: username,
                password: hashedPassword
            })
            await admin.save()
            req.flash('success', 'Admin Account Created Successfully!')
            res.redirect('/admin/users/new-admin')
        }catch(err){
            console.log(err)
            req.flash('danger', 'An Error Ocurred, Please Try Again!')
            res.redirect('/admin/users/new-admin')
        }
    }
})
app.post('/new-user', (req,res)=>{

    const details = req.body
    const firstname = details.firstname
    const lastname = details.lastname
    const username = details.username
    const password = details.password

    registerUser()

    async function registerUser(){
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        try{
            const user = new userSchema({
                firstname: firstname,
                lastname: lastname,
                username: username,
                password: hashedPassword
            })
            await user.save()
            req.flash('success', 'User Account Created Successfully!')
            res.redirect('/admin/users/new-user')
        }catch(err){
            console.log(err)
            req.flash('danger', 'An Error Ocurred, Please Try Again!')
            res.redirect('/admin/users/new-user')
        }
    }
})
app.post('/new-profile', (req,res)=>{

    const details = req.body
    const firstname = details.firstname
    const lastname = details.lastname
    const supervisor = details.supervisor
    const location = details.location
    const expiry = details.expiry
    const currentDate = new Date();
    const formattedDateTime = currentDate.toLocaleDateString();

    registerUser()

    async function registerUser(){
        try{
            const profile = new profileSchema({
                firstname: firstname,
                lastname: lastname,
                supervisor: supervisor,
                location: location,
                expiry: expiry,
                created: formattedDateTime

            })
            await profile.save()
            req.flash('success', 'New Profile Created Successfully!')
            res.redirect('/admin/manage/new-profile')
        }catch(err){
            console.log(err)
            req.flash('danger', 'An Error Ocurred, Please Try Again!')
            res.redirect('/admin/manage/new-profile')
        }
    }
})

app.post('/edit-profile', (req,res)=>{
    const details= req.body
    const id = details.id
    const filter = {_id: id}
    const firstname = details.firstname
    const lastname = details.lastname
    const supervisor = details.supervisor
    const location = details.location
    const expiry = details.expiry

    profileSchema.findOneAndUpdate(filter, {$set: {firstname: firstname, lastname: lastname, supervisor: supervisor, location:location, expiry:expiry}}, {new: true}, (err)=>{
        if(err){
            console.log(err)
            req.flash('danger', 'An Error Ocurred, Please Try Again!')
            res.redirect(`/admin/profile/view/${id}`)
        } else{
            req.flash('success', 'Profile Updated Successfully!')
            res.redirect(`/admin/profile/view/${id}`)
        }
    })

})

app.post('/admin/delete', (req,res)=>{
    const details= req.body
    const id = details.id
    const filter = {_id: id}

    adminSchema.deleteOne(filter).then(function(){
        console.log("Admin deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });

    res.redirect('/admin/users')
})

app.post('/user/delete', (req,res)=>{
    const details= req.body
    const id = details.id
    const filter = {_id: id}

    userSchema.deleteOne(filter).then(function(){
        console.log("User deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });

    res.redirect('/admin/users')
})

app.post('/profile/delete', (req,res)=>{
    const details= req.body
    const id = details.id
    const filter = {_id: id}

    profileSchema.deleteOne(filter).then(function(){
        console.log("Profile deleted"); // Success
    }).catch(function(error){
        console.log(error); // Failure
    });

    res.redirect('/admin/manage')
})

app.get('/admin/profile/view/:id', protectAdminRoute, async(req,res)=>{
    const id = req.params.id

    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    const filter = {_id: id}
    const profile = await profileSchema.findOne(filter)
    res.render('view-profile', {profile: profile, theuser: theuser})
})

app.get('/logout', (req,res)=>{
    res.clearCookie('logintoken')
     return res.redirect('/')
})

app.get('/admin/logout', (req,res)=>{
    res.clearCookie('admintoken')
     return res.redirect('/admin')
})

app.get('/access',protectRoute, async function(req,res){ 
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('user-access', {theuser: theuser})
})

app.get('/logs',protectRoute, async function(req,res){ 
    const auser = req.user.user.username
    const theuser = await adminSchema.findOne({username: auser})
    res.render('user-logs', {theuser: theuser})
})

function protectRoute(req, res, next){
    const token = req.cookies.logintoken
    try{
        const user = jwt.verify(token, secretkey)
  
        req.user = user
        // console.log(req.user)
        next()
    }
    catch(err){
        res.clearCookie('logintoken')
        return res.redirect('/')
    }
}

app.get('/access/:id', async (req,res)=>{
    const id = req.params.id

    try{
        const user = await userSchema.findOne({_id: id})

        return res.send(user)
    } catch{
        return res.status(404).json({ message: 'User not found' });
    }
})

const port = process.env.PORT || 5000

app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )