import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { UserButton } from '@clerk/clerk-react'

const Navbar = () => {
  return (
    <div className='flex items-center justify-between px-4 md:px-8
    border-b border-gray-300 py-3 bg-white transtion-all
    duration-300'>
        <Link to='/'>
        <img src={assets.logo1} alt="logo" className='h-15  invert
        opacity-80'/>
        </Link>
        <UserButton/>

    </div>
  )
}

export default Navbar