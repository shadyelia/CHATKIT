import { Component } from "@angular/core";
import Chatkit from "@pusher/chatkit-client";
import axios from "axios";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  userId = "";
  currentUser = <any>{};
  messages = [];
  currentRoom = <any>{};
  roomUsers = [];
  userRooms = [];
  newMessage = "";
  newRoom = {
    name: "",
    isPrivate: false
  };
  joinableRooms = [];
  newUser = "";

  connectToRoom(id) {
    this.messages = [];
    const { currentUser } = this;

    currentUser
      .subscribeToRoom({
        roomId: `${id}`,
        messageLimit: 100,
        hooks: {
          onMessage: message => {
            this.messages.push(message);
          },
          onPresenceChanged: () => {
            this.roomUsers = this.currentRoom.users.sort(a => {
              if (a.presence.state === "online") return -1;

              return 1;
            });
          }
        }
      })
      .then(currentRoom => {
        this.currentRoom = currentRoom;
        this.roomUsers = currentRoom.users;
        this.userRooms = currentUser.rooms;
      });
  }

  sendMessage() {
    const { newMessage, currentUser, currentRoom } = this;

    if (newMessage.trim() === "") return;

    currentUser.sendMessage({
      text: newMessage,
      roomId: `${currentRoom.id}`
    });

    this.newMessage = "";
  }

  addUser() {
    const { userId } = this;
    axios
      .post("http://localhost:5200/users", { userId })
      .then(() => {
        const tokenProvider = new Chatkit.TokenProvider({
          url: "http://localhost:5200/authenticate"
        });
        const chatManager = new Chatkit.ChatManager({
          instanceLocator: "v1:us1:cd98d4cf-e8dc-4541-a478-d80d7db00f64",
          userId,
          tokenProvider
        });
        return chatManager
          .connect({
            onAddedToRoom: room => {
              this.userRooms.push(room);
              this.getJoinableRooms();
            }
          })
          .then(currentUser => {
            this.currentUser = currentUser;
            this.connectToRoom("064f2d6f-fa63-4bcd-b033-fc8e3ac81594");
            this.getJoinableRooms();
          });
      })
      .catch(error => console.error(error));
  }

  createRoom() {
    const {
      newRoom: { name, isPrivate },
      currentUser
    } = this;

    if (name.trim() === "") return;

    currentUser
      .createRoom({
        name,
        private: isPrivate
      })
      .then(room => {
        this.connectToRoom(room.id);
        this.newRoom = {
          name: "",
          isPrivate: false
        };
      })
      .catch(err => {
        console.log(`Error creating room ${err}`);
      });
  }

  getJoinableRooms() {
    const { currentUser } = this;
    currentUser
      .getJoinableRooms()
      .then(rooms => {
        this.joinableRooms = rooms;
      })
      .catch(err => {
        console.log(`Error getting joinable rooms: ${err}`);
      });
  }

  joinRoom(id) {
    const { currentUser } = this;
    currentUser.joinRoom({ roomId: id }).catch(err => {
      console.log(`Error joining room ${id}: ${err}`);
    });
  }

  addUserToRoom() {
    const { newUser, currentUser, currentRoom } = this;
    currentUser
      .addUserToRoom({
        userId: newUser,
        roomId: currentRoom.id
      })
      .then(currentRoom => {
        this.roomUsers = currentRoom.users;
      })
      .catch(err => {
        console.log(`Error adding user: ${err}`);
      });

    this.newUser = "";
  }
}
