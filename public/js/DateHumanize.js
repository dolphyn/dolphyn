var DateHumanize = {

  humanize: function(date) {
    var dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    var monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    var now = new Date()

    var dateString = ''



    if(date.getFullYear() !== now.getFullYear()) {

      if(date.getMonth() !== now.getMonth()) {

        dateString += monthName[date.getMonth()]
        dateString += ' ' + formatDay(date.getDate())
      }

      dateString += ', ' + date.getFullYear()

    } else {

      if(date.getMonth() !== now.getMonth()) {

        dateString += monthName[date.getMonth()]
        dateString += ' ' + formatDay(date.getDate())
        dateString += ', ' + formatTime(date)

      } else {

        if(date.getDate() <= (now.getDate() - 2)) {
          dateString += dayName[date.getDay()]
          dateString += ', ' + formatDay(date.getDate())
        } else {
          dateString += (date.getDate() == now.getDate()) ? 'Today' : 'Yesterday'
          dateString += ', ' + formatTime(date)
        }

      }

      return dateString
    }

    function formatDay(day) {
      switch(day) {
        case 1:
        case 21:
        case 31:
          return day + 'st'
        case 2:
        case 22:
          return day + 'nd'
        case 3:
        case 23:
          return day + 'rd'
        default:
          return day + 'th'
      }
    }

    function formatTime(date) {
      var readableTime = ''

      readableTime += date.getHours() + ':'

      if(date.getMinutes() < 10) {
        readableTime += '0'
      }

      readableTime += date.getMinutes()

      return readableTime
    }
  }

}