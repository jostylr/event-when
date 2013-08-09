change emit to be  "immediate", "now", "later" where "now" is the current default and "later" is a callback emit which is when the handlers are added. For "now", the emit uses the handlers at that time of first calling. 

add in to emitwhen the option to have the event be a function called or an array of function/events. 

do an example of logs and get the log stuff strewn in.