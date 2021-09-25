import React from 'react';
import logo from '../near.png'

export default function SignIn() {
  return (
    <>
      <div>
        <br/>
        <p className="margin-10">Near Registry allows you to track popular content just like Hacker News. </p>
        <p className="margin-10">Anyone can post an entry to the Near Registry. Upvoting the content requires you to
          attach NEAR.</p>
        <img src={logo} width="400" height="400"/>
      </div>
    </>
  );
}